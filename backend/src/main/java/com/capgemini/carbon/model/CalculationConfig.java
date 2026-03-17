package com.capgemini.carbon.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "calculation_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalculationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String configKey;

    @Column(nullable = false)
    private Double configValue;

    @Column
    private String label;

    @Column
    private String unit;

    @Column
    private String category;

    @Column
    private String source;
}
