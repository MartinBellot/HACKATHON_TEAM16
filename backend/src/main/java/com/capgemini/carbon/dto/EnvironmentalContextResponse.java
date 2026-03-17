package com.capgemini.carbon.dto;

import lombok.Data;
import java.util.List;

@Data
public class EnvironmentalContextResponse {

    // DPE — nearby building energy performance
    private DpeContext dpe;

    // Weather / Climate
    private ClimateContext climate;

    // Nearby public transport
    private TransportContext transport;

    @Data
    public static class DpeContext {
        private Integer nearbyBuildingsCount;
        private Double averageDpe; // kWhEP/m²/an moyen
        private String dominantLabel; // A-G
        private List<DpeDistribution> distribution;
    }

    @Data
    public static class DpeDistribution {
        private String label; // A, B, C...
        private Integer count;
    }

    @Data
    public static class ClimateContext {
        private Double annualMeanTemp; // °C
        private Double heatingDegreeDays; // DJU
        private Double coolingDegreeDays;
        private Double annualSolarRadiation; // kWh/m²
        private String climateZone; // H1a, H1b, H2a...
    }

    @Data
    public static class TransportContext {
        private Integer busStopsNearby; // rayon 500m
        private Integer tramStopsNearby;
        private Integer metroStopsNearby;
        private Integer trainStationsNearby;
        private Integer bikeShareNearby;
        private Double nearestStopDistance; // mètres
        private String nearestStopName;
        private String accessibilityScore; // Excellent / Bon / Moyen / Faible
    }
}
