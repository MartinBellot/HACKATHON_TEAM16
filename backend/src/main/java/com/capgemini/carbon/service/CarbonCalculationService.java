package com.capgemini.carbon.service;

import com.capgemini.carbon.model.Site;
import org.springframework.stereotype.Service;

/**
 * Service de calcul de l'empreinte carbone
 * Facteurs d'émission basés sur les données ADEME
 */
@Service
public class CarbonCalculationService {

    // Facteurs d'émission pour les matériaux de construction (kgCO2e/tonne)
    private static final double CONCRETE_EMISSION_FACTOR = 235.0; // Béton
    private static final double STEEL_EMISSION_FACTOR = 1850.0;   // Acier
    private static final double GLASS_EMISSION_FACTOR = 850.0;    // Verre
    private static final double WOOD_EMISSION_FACTOR = -500.0;    // Bois (capture carbone)

    // Facteur d'émission pour l'énergie (kgCO2e/MWh)
    // Mix électrique français - ADEME Base Carbone
    private static final double ENERGY_EMISSION_FACTOR = 52.0;

    // Facteur d'émission pour le parking (kgCO2e/place/an)
    private static final double PARKING_EMISSION_FACTOR = 150.0;

    // Durée de vie de référence du bâtiment (RE2020)
    private static final double BUILDING_LIFESPAN = 50.0;

    /**
     * Calcule l'empreinte carbone totale d'un site
     */
    public void calculateFootprint(Site site) {
        // Calcul de l'empreinte de construction
        double constructionFootprint = calculateConstructionFootprint(site);

        // Calcul de l'empreinte opérationnelle annuelle
        double operationalFootprint = calculateOperationalFootprint(site);

        // Calcul des indicateurs (annualisé : construction amortie sur 50 ans + opérationnel annuel)
        double totalFootprint = (constructionFootprint / BUILDING_LIFESPAN) + operationalFootprint;
        double footprintPerM2 = totalFootprint / site.getTotalSurface();
        double footprintPerEmployee = site.getEmployees() != null && site.getEmployees() > 0
                ? totalFootprint / site.getEmployees()
                : 0.0;

        // Mise à jour du site
        site.setConstructionFootprint(constructionFootprint);
        site.setOperationalFootprint(operationalFootprint);
        site.setTotalFootprint(totalFootprint);
        site.setFootprintPerM2(footprintPerM2);
        site.setFootprintPerEmployee(footprintPerEmployee);
    }

    /**
     * Calcule l'empreinte carbone de la construction
     */
    private double calculateConstructionFootprint(Site site) {
        double total = 0.0;

        if (site.getConcreteQuantity() != null) {
            total += site.getConcreteQuantity() * CONCRETE_EMISSION_FACTOR;
        }

        if (site.getSteelQuantity() != null) {
            total += site.getSteelQuantity() * STEEL_EMISSION_FACTOR;
        }

        if (site.getGlassQuantity() != null) {
            total += site.getGlassQuantity() * GLASS_EMISSION_FACTOR;
        }

        if (site.getWoodQuantity() != null) {
            total += site.getWoodQuantity() * WOOD_EMISSION_FACTOR;
        }

        // Estimation basée sur la surface si pas de données matériaux
        if (total == 0.0) {
            // Estimation: 800 kgCO2e/m² pour un bâtiment tertiaire
            total = site.getTotalSurface() * 800.0;
        }

        return total;
    }

    /**
     * Calcule l'empreinte carbone opérationnelle annuelle
     * Applique un facteur d'échelle : les grands bâtiments sont plus efficaces
     * grâce à la mutualisation des équipements (CVC, éclairage, etc.)
     */
    private double calculateOperationalFootprint(Site site) {
        double total = 0.0;

        // Émissions liées à la consommation énergétique (MWh * kgCO2e/MWh)
        total += site.getEnergyConsumption() * ENERGY_EMISSION_FACTOR;

        // Émissions liées au parking
        if (site.getParkingPlaces() != null) {
            total += site.getParkingPlaces() * PARKING_EMISSION_FACTOR;
        }

        // Facteur d'échelle : les petits bâtiments (<2000m²) sont moins efficaces
        // car ils mutualisent moins les équipements techniques
        // Ref surface = 5000m², facteur varie de 1.3 (petit) à 0.85 (très grand)
        double surface = site.getTotalSurface();
        double scaleFactor = 1.0 + 0.3 * Math.exp(-surface / 2000.0) - 0.15 * (1 - Math.exp(-surface / 20000.0));
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

        // Getters and Setters
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
