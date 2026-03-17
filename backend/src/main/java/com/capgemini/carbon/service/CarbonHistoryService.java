package com.capgemini.carbon.service;

import com.capgemini.carbon.model.Site;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service d'historisation des émissions carbone.
 * Reconstruit l'évolution sur 5 ans en croisant :
 * - RTE éCO2mix : intensité carbone réelle du réseau électrique français par année
 * - Open-Meteo Archive : DJU chauffage/clim réels par année → variation de la conso estimée
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarbonHistoryService {

    private final RestTemplate restTemplate;

    // Intensité carbone du réseau électrique français (gCO₂/kWh) — source RTE éCO2mix
    private static final Map<Integer, Double> GRID_CARBON_INTENSITY = Map.of(
        2020, 52.0,
        2021, 55.0,
        2022, 62.0,  // Arrêts nucléaires → hausse significative
        2023, 56.0,
        2024, 52.0,
        2025, 50.0   // Projection basse (reprise nucléaire + renouvelables)
    );

    // Référence : facteur actuel utilisé dans les calculs (52 kgCO₂e/MWh = 52 gCO₂/kWh)
    private static final double REFERENCE_ENERGY_FACTOR = 52.0;
    // Référence DJU chauffage pour calibrer les variations (moyenne France métropolitaine)
    private static final double REFERENCE_HDD = 2200.0;
    private static final double REFERENCE_CDD = 80.0;

    private static final double PARKING_EMISSION_FACTOR = 150.0;
    private static final double BUILDING_LIFESPAN = 50.0;

    @Cacheable(value = "carbonHistory", key = "#site.id")
    public List<YearlyFootprint> getHistory(Site site) {
        if (site.getLatitude() == null || site.getLongitude() == null) {
            return buildFallbackHistory(site);
        }

        List<YearlyFootprint> history = new ArrayList<>();

        for (int year = 2020; year <= 2025; year++) {
            try {
                YearlyFootprint yf = calculateYearFootprint(site, year);
                history.add(yf);
            } catch (Exception e) {
                log.warn("Failed to calculate history for year {} site {}: {}", year, site.getId(), e.getMessage());
                history.add(buildFallbackYear(site, year));
            }
        }

        return history;
    }

    private YearlyFootprint calculateYearFootprint(Site site, int year) {
        // 1. Fetch climate data for this year from Open-Meteo
        ClimateYear climate = fetchClimateForYear(site.getLatitude(), site.getLongitude(), year);

        // 2. Get grid carbon intensity for this year
        double gridFactor = GRID_CARBON_INTENSITY.getOrDefault(year, REFERENCE_ENERGY_FACTOR);

        // 3. Calculate operational footprint variation based on climate
        double hddRatio = climate.hdd / REFERENCE_HDD; // >1 = colder year = more heating
        double cddRatio = REFERENCE_CDD > 0 ? climate.cdd / REFERENCE_CDD : 1.0;

        // Energy consumption varies: ~70% heating, ~20% cooling, ~10% base load
        double energyVariation = 0.70 * hddRatio + 0.20 * cddRatio + 0.10;

        // Adjusted energy consumption for this year
        double adjustedEnergy = site.getEnergyConsumption() * energyVariation;

        // Operational footprint with year-specific grid factor (kgCO₂e/MWh)
        double operationalFootprint = adjustedEnergy * gridFactor;

        // Add parking
        if (site.getParkingPlaces() != null) {
            operationalFootprint += site.getParkingPlaces() * PARKING_EMISSION_FACTOR;
        }

        // Apply scale factor (same as CarbonCalculationService)
        double surface = site.getTotalSurface();
        double scaleFactor = 1.0 + 0.3 * Math.exp(-surface / 2000.0) - 0.15 * (1 - Math.exp(-surface / 20000.0));
        operationalFootprint *= scaleFactor;

        // Construction footprint (amortized, constant)
        double constructionFootprint = calculateConstructionFootprint(site);
        double annualizedConstruction = constructionFootprint / BUILDING_LIFESPAN;

        double totalFootprint = annualizedConstruction + operationalFootprint;
        double footprintPerM2 = totalFootprint / surface;

        YearlyFootprint yf = new YearlyFootprint();
        yf.setYear(year);
        yf.setTotalFootprint(Math.round(totalFootprint * 100.0) / 100.0);
        yf.setConstructionFootprint(Math.round(annualizedConstruction * 100.0) / 100.0);
        yf.setOperationalFootprint(Math.round(operationalFootprint * 100.0) / 100.0);
        yf.setFootprintPerM2(Math.round(footprintPerM2 * 100.0) / 100.0);
        yf.setGridCarbonIntensity(gridFactor);
        yf.setHeatingDegreeDays(Math.round(climate.hdd));
        yf.setCoolingDegreeDays(Math.round(climate.cdd));
        yf.setMeanTemperature(Math.round(climate.meanTemp * 10.0) / 10.0);
        return yf;
    }

    private ClimateYear fetchClimateForYear(double lat, double lon, int year) {
        int endYear = year;
        // For 2025, use partial data up to now or fall back
        String startDate = year + "-01-01";
        String endDate = year == 2025 ? "2025-03-01" : year + "-12-31";

        String url = String.format(java.util.Locale.US,
            "https://archive-api.open-meteo.com/v1/archive"
            + "?latitude=%f&longitude=%f"
            + "&start_date=%s&end_date=%s"
            + "&daily=temperature_2m_mean"
            + "&timezone=Europe/Paris",
            lat, lon, startDate, endDate
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> result = restTemplate.getForObject(url, Map.class);
        ClimateYear cy = new ClimateYear();

        if (result == null) {
            cy.hdd = REFERENCE_HDD;
            cy.cdd = REFERENCE_CDD;
            cy.meanTemp = 12.0;
            return cy;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> daily = (Map<String, Object>) result.getOrDefault("daily", Map.of());
        @SuppressWarnings("unchecked")
        List<Number> temps = (List<Number>) daily.getOrDefault("temperature_2m_mean", List.of());

        if (temps.isEmpty()) {
            cy.hdd = REFERENCE_HDD;
            cy.cdd = REFERENCE_CDD;
            cy.meanTemp = 12.0;
            return cy;
        }

        cy.meanTemp = temps.stream()
            .filter(Objects::nonNull)
            .mapToDouble(Number::doubleValue)
            .average()
            .orElse(12.0);

        cy.hdd = temps.stream()
            .filter(Objects::nonNull)
            .mapToDouble(t -> Math.max(0, 18.0 - t.doubleValue()))
            .sum();

        cy.cdd = temps.stream()
            .filter(Objects::nonNull)
            .mapToDouble(t -> Math.max(0, t.doubleValue() - 24.0))
            .sum();

        // For 2025 (partial year), extrapolate to full year
        if (year == 2025 && temps.size() < 365) {
            double factor = 365.0 / temps.size();
            cy.hdd *= factor;
            cy.cdd *= factor;
        }

        return cy;
    }

    private double calculateConstructionFootprint(Site site) {
        double total = 0.0;
        if (site.getConcreteQuantity() != null) total += site.getConcreteQuantity() * 235.0;
        if (site.getSteelQuantity() != null) total += site.getSteelQuantity() * 1850.0;
        if (site.getGlassQuantity() != null) total += site.getGlassQuantity() * 850.0;
        if (site.getWoodQuantity() != null) total += site.getWoodQuantity() * -500.0;
        if (total == 0.0) total = site.getTotalSurface() * 800.0;
        return total;
    }

    private List<YearlyFootprint> buildFallbackHistory(Site site) {
        List<YearlyFootprint> history = new ArrayList<>();
        for (int year = 2020; year <= 2025; year++) {
            history.add(buildFallbackYear(site, year));
        }
        return history;
    }

    private YearlyFootprint buildFallbackYear(Site site, int year) {
        double gridFactor = GRID_CARBON_INTENSITY.getOrDefault(year, REFERENCE_ENERGY_FACTOR);
        double gridRatio = gridFactor / REFERENCE_ENERGY_FACTOR;

        double currentTotal = site.getTotalFootprint() != null ? site.getTotalFootprint() : 0;
        double currentConstruction = site.getConstructionFootprint() != null
            ? site.getConstructionFootprint() / BUILDING_LIFESPAN : 0;
        double currentOperational = site.getOperationalFootprint() != null
            ? site.getOperationalFootprint() : 0;

        double adjustedOperational = currentOperational * gridRatio;
        double total = currentConstruction + adjustedOperational;

        YearlyFootprint yf = new YearlyFootprint();
        yf.setYear(year);
        yf.setTotalFootprint(Math.round(total * 100.0) / 100.0);
        yf.setConstructionFootprint(Math.round(currentConstruction * 100.0) / 100.0);
        yf.setOperationalFootprint(Math.round(adjustedOperational * 100.0) / 100.0);
        yf.setFootprintPerM2(site.getTotalSurface() > 0
            ? Math.round(total / site.getTotalSurface() * 100.0) / 100.0 : 0);
        yf.setGridCarbonIntensity(gridFactor);
        yf.setHeatingDegreeDays(0.0);
        yf.setCoolingDegreeDays(0.0);
        yf.setMeanTemperature(0.0);
        return yf;
    }

    // ── Inner classes ──

    private static class ClimateYear {
        double hdd;
        double cdd;
        double meanTemp;
    }

    public static class YearlyFootprint {
        private int year;
        private double totalFootprint;
        private double constructionFootprint;
        private double operationalFootprint;
        private double footprintPerM2;
        private double gridCarbonIntensity;
        private double heatingDegreeDays;
        private double coolingDegreeDays;
        private double meanTemperature;

        public int getYear() { return year; }
        public void setYear(int year) { this.year = year; }
        public double getTotalFootprint() { return totalFootprint; }
        public void setTotalFootprint(double v) { this.totalFootprint = v; }
        public double getConstructionFootprint() { return constructionFootprint; }
        public void setConstructionFootprint(double v) { this.constructionFootprint = v; }
        public double getOperationalFootprint() { return operationalFootprint; }
        public void setOperationalFootprint(double v) { this.operationalFootprint = v; }
        public double getFootprintPerM2() { return footprintPerM2; }
        public void setFootprintPerM2(double v) { this.footprintPerM2 = v; }
        public double getGridCarbonIntensity() { return gridCarbonIntensity; }
        public void setGridCarbonIntensity(double v) { this.gridCarbonIntensity = v; }
        public double getHeatingDegreeDays() { return heatingDegreeDays; }
        public void setHeatingDegreeDays(double v) { this.heatingDegreeDays = v; }
        public double getCoolingDegreeDays() { return coolingDegreeDays; }
        public void setCoolingDegreeDays(double v) { this.coolingDegreeDays = v; }
        public double getMeanTemperature() { return meanTemperature; }
        public void setMeanTemperature(double v) { this.meanTemperature = v; }
    }
}
