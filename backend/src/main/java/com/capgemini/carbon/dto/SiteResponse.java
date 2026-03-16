package com.capgemini.carbon.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SiteResponse {
    private Long id;
    private String name;
    private String location;
    private Double totalSurface;
    private Integer parkingPlaces;
    private Integer undergroundParking;
    private Integer groundParking;
    private Integer aerialParking;
    private Double energyConsumption;
    private Integer employees;
    private Integer workstations;
    private Double concreteQuantity;
    private Double steelQuantity;
    private Double glassQuantity;
    private Double woodQuantity;
    private Double constructionFootprint;
    private Double operationalFootprint;
    private Double totalFootprint;
    private Double footprintPerM2;
    private Double footprintPerEmployee;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
