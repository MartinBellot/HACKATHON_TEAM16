package com.capgemini.carbon.service;

import com.capgemini.carbon.model.CalculationConfig;
import com.capgemini.carbon.model.Site;
import com.capgemini.carbon.repository.CalculationConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service de calcul de l'empreinte carbone
 * Facteurs d'émission lus depuis la base de données (table calculation_config)
 */
@Service
@RequiredArgsConstructor
public class CarbonCalculationService {

    private final CalculationConfigRepository configRepo;

    private Map<String, Double> loadConfig() {
        return configRepo.findAll().stream()
            .collect(Collectors.toMap(CalculationConfig::getConfigKey, CalculationConfig::getConfigValue));
    }

    private double cfg(Map<String, Double> config, String key, double fallback) {
        return config.getOrDefault(key, fallback);
    }

    /**
     * Calcule l'empreinte carbone totale d'un site
     */
    public void calculateFootprint(Site site) {
        Map<String, Double> config = loadConfig();

        double constructionFootprint = calculateConstructionFootprint(site, config);
        double operationalFootprint = calculateOperationalFootprint(site, config);

        double lifespan = cfg(config, "BUILDING_LIFESPAN", 50.0);
        double totalFootprint = (constructionFootprint / lifespan) + operationalFootprint;
        double footprintPerM2 = totalFootprint / site.getTotalSurface();
        double footprintPerEmployee = site.getEmployees() != null && site.getEmployees() > 0
                ? totalFootprint / site.getEmployees()
                : 0.0;

        site.setConstructionFootprint(constructionFootprint);
        site.setOperationalFootprint(operationalFootprint);
        site.setTotalFootprint(totalFootprint);
        site.setFootprintPerM2(footprintPerM2);
        site.setFootprintPerEmployee(footprintPerEmployee);
    }

    private double calculateConstructionFootprint(Site site, Map<String, Double> config) {
        double total = 0.0;

        if (site.getConcreteQuantity() != null) {
            total += site.getConcreteQuantity() * cfg(config, "CONCRETE_EMISSION_FACTOR", 235.0);
        }
        if (site.getSteelQuantity() != null) {
            total += site.getSteelQuantity() * cfg(config, "STEEL_EMISSION_FACTOR", 1850.0);
        }
        if (site.getGlassQuantity() != null) {
            total += site.getGlassQuantity() * cfg(config, "GLASS_EMISSION_FACTOR", 850.0);
        }
        if (site.getWoodQuantity() != null) {
            total += site.getWoodQuantity() * cfg(config, "WOOD_EMISSION_FACTOR", -500.0);
        }

        if (total == 0.0) {
            total = site.getTotalSurface() * cfg(config, "DEFAULT_CONSTRUCTION_FACTOR", 800.0);
        }

        return total;
    }

    private double calculateOperationalFootprint(Site site, Map<String, Double> config) {
        double total = 0.0;

        total += site.getEnergyConsumption() * cfg(config, "ENERGY_EMISSION_FACTOR", 52.0);

        if (site.getParkingPlaces() != null) {
            total += site.getParkingPlaces() * cfg(config, "PARKING_EMISSION_FACTOR", 150.0);
        }

        double surface = site.getTotalSurface();
        double scaleBase = cfg(config, "SCALE_BASE", 1.0);
        double scaleSmallBonus = cfg(config, "SCALE_SMALL_BONUS", 0.3);
        double scaleSmallDecay = cfg(config, "SCALE_SMALL_DECAY", 2000.0);
        double scaleLargeBonus = cfg(config, "SCALE_LARGE_BONUS", 0.15);
        double scaleLargeDecay = cfg(config, "SCALE_LARGE_DECAY", 20000.0);

        double scaleFactor = scaleBase
            + scaleSmallBonus * Math.exp(-surface / scaleSmallDecay)
            - scaleLargeBonus * (1 - Math.exp(-surface / scaleLargeDecay));
        total *= scaleFactor;

        return total;
    }

    /**
     * Compare deux sites et retourne les différences
     */
    public ComparisonResult compareSites(Site site1, Site site2) {
        ComparisonResult result = new ComparisonResult();
        result.setSite1Name(site1.getName());
        result.setSite2Name(site2.getName());
        result.setTotalDifference(site1.getTotalFootprint() - site2.getTotalFootprint());
        result.setConstructionDifference(site1.getConstructionFootprint() - site2.getConstructionFootprint());
        result.setOperationalDifference(site1.getOperationalFootprint() - site2.getOperationalFootprint());
        result.setPerM2Difference(site1.getFootprintPerM2() - site2.getFootprintPerM2());
        return result;
    }

    public static class ComparisonResult {
        private String site1Name;
        private String site2Name;
        private Double totalDifference;
        private Double constructionDifference;
        private Double operationalDifference;
        private Double perM2Difference;

        public String getSite1Name() { return site1Name; }
        public void setSite1Name(String site1Name) { this.site1Name = site1Name; }
        public String getSite2Name() { return site2Name; }
        public void setSite2Name(String site2Name) { this.site2Name = site2Name; }
        public Double getTotalDifference() { return totalDifference; }
        public void setTotalDifference(Double totalDifference) { this.totalDifference = totalDifference; }
        public Double getConstructionDifference() { return constructionDifference; }
        public void setConstructionDifference(Double constructionDifference) { this.constructionDifference = constructionDifference; }
        public Double getOperationalDifference() { return operationalDifference; }
        public void setOperationalDifference(Double operationalDifference) { this.operationalDifference = operationalDifference; }
        public Double getPerM2Difference() { return perM2Difference; }
        public void setPerM2Difference(Double perM2Difference) { this.perM2Difference = perM2Difference; }
    }
}
