package com.capgemini.carbon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class SiteRequest {
    @NotBlank
    private String name;

    private String location;

    @NotNull
    @Positive
    private Double totalSurface;

    private Integer parkingPlaces;
    private Integer undergroundParking;
    private Integer groundParking;
    private Integer aerialParking;

    @NotNull
    @Positive
    private Double energyConsumption;

    private Integer employees;
    private Integer workstations;

    // Matériaux (tonnes)
    private Double concreteQuantity;
    private Double steelQuantity;
    private Double glassQuantity;
    private Double woodQuantity;
}
