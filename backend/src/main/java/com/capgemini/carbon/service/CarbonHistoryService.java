package com.capgemini.carbon.service;

import com.capgemini.carbon.model.CalculationConfig;
import com.capgemini.carbon.model.Site;
import com.capgemini.carbon.repository.CalculationConfigRepository;
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
    private final CalculationConfigRepository configRepo;

    private static final double REFERENCE_HDD = 2200.0;
    private static final double REFERENCE_CDD = 80.0;

    private Map<String, Double> loadConfig() {
        return configRepo.findAll().stream()
            .collect(Collectors.toMap(CalculationConfig::getConfigKey, CalculationConfig::getConfigValue));
    }

    private double cfg(Map<String, Double> config, String key, double fallback) {
        return config.getOrDefault(key, fallback);
    }

    private Map<Integer, Double> getGridIntensities(Map<String, Double> config) {
        Map<Integer, Double> grid = new HashMap<>();
        for (int y = 2020; y <= 2025; y++) {
            grid.put(y, cfg(config, "GRID_INTENSITY_" + y, 52.0));
        }
        return grid;
    }

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
        Map<String, Double> config = loadConfig();
        Map<Integer, Double> gridIntensities = getGridIntensities(config);

        ClimateYear climate = fetchClimateForYear(site.getLatitude(), site.getLongitude(), year);

        double gridFactor = gridIntensities.getOrDefault(year, cfg(config, "ENERGY_EMISSION_FACTOR", 52.0));

        double hddRatio = climate.hdd / REFERENCE_HDD;
        double cddRatio = REFERENCE_CDD > 0 ? climate.cdd / REFERENCE_CDD : 1.0;
        double energyVariation = 0.70 * hddRatio + 0.20 * cddRatio + 0.10;
        double adjustedEnergy = site.getEnergyConsumption() * energyVariation;

        double operationalFootprint = adjustedEnergy * gridFactor;

        if (site.getParkingPlaces() != null) {
            operationalFootprint += site.getParkingPlaces() * cfg(config, "PARKING_EMISSION_FACTOR", 150.0);
        }

        double surface = site.getTotalSurface();
        double scaleBase = cfg(config, "SCALE_BASE", 1.0);
        double scaleSmallBonus = cfg(config, "SCALE_SMALL_BONUS", 0.3);
        double scaleSmallDecay = cfg(config, "SCALE_SMALL_DECAY", 2000.0);
        double scaleLargeBonus = cfg(config, "SCALE_LARGE_BONUS", 0.15);
        double scaleLargeDecay = cfg(config, "SCALE_LARGE_DECAY", 20000.0);
        double scaleFactor = scaleBase + scaleSmallBonus * Math.exp(-surface / scaleSmallDecay) - scaleLargeBonus * (1 - Math.exp(-surface / scaleLargeDecay));
        operationalFootprint *= scaleFactor;

        double constructionFootprint = calculateConstructionFootprint(site, config);
        double lifespan = cfg(config, "BUILDING_LIFESPAN", 50.0);
        double annualizedConstruction = constructionFootprint / lifespan;

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

    private double calculateConstructionFootprint(Site site, Map<String, Double> config) {
        double total = 0.0;
        if (site.getConcreteQuantity() != null) total += site.getConcreteQuantity() * cfg(config, "CONCRETE_EMISSION_FACTOR", 235.0);
        if (site.getSteelQuantity() != null) total += site.getSteelQuantity() * cfg(config, "STEEL_EMISSION_FACTOR", 1850.0);
        if (site.getGlassQuantity() != null) total += site.getGlassQuantity() * cfg(config, "GLASS_EMISSION_FACTOR", 850.0);
        if (site.getWoodQuantity() != null) total += site.getWoodQuantity() * cfg(config, "WOOD_EMISSION_FACTOR", -500.0);
        if (total == 0.0) total = site.getTotalSurface() * cfg(config, "DEFAULT_CONSTRUCTION_FACTOR", 800.0);
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
        Map<String, Double> config = loadConfig();
        Map<Integer, Double> gridIntensities = getGridIntensities(config);
        double refFactor = cfg(config, "ENERGY_EMISSION_FACTOR", 52.0);
        double gridFactor = gridIntensities.getOrDefault(year, refFactor);
        double gridRatio = gridFactor / refFactor;
        double lifespan = cfg(config, "BUILDING_LIFESPAN", 50.0);

        double currentConstruction = site.getConstructionFootprint() != null
            ? site.getConstructionFootprint() / lifespan : 0;
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
