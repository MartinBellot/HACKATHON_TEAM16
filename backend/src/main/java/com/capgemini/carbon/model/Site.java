package com.capgemini.carbon.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sites")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Site {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String location;

    @Column(nullable = false)
    private Double totalSurface; // m²

    private Integer parkingPlaces;
    private Integer undergroundParking;
    private Integer groundParking;
    private Integer aerialParking;

    @Column(nullable = false)
    private Double energyConsumption; // MWh/an

    private Integer employees;
    private Integer workstations;

    // Matériaux de construction (en tonnes)
    private Double concreteQuantity;
    private Double steelQuantity;
    private Double glassQuantity;
    private Double woodQuantity;

    // Calculs CO2 (en kgCO2e)
    private Double constructionFootprint;
    private Double operationalFootprint;
    private Double totalFootprint;
    private Double footprintPerM2;
    private Double footprintPerEmployee;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
