package com.capgemini.carbon.config;

import com.capgemini.carbon.model.CalculationConfig;
import com.capgemini.carbon.repository.CalculationConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CalculationConfigRepository configRepo;

    @Override
    public void run(String... args) {
        if (configRepo.count() > 0) {
            log.info("Calculation config already seeded ({} entries)", configRepo.count());
            return;
        }

        log.info("Seeding calculation config with default values...");

        List<CalculationConfig> defaults = List.of(
            // Matériaux
            cfg("CONCRETE_EMISSION_FACTOR", 235.0, "Béton", "kgCO₂e/tonne", "Matériaux", "ADEME Base Carbone® — CEM II/A"),
            cfg("STEEL_EMISSION_FACTOR", 1850.0, "Acier", "kgCO₂e/tonne", "Matériaux", "ADEME Base Carbone® — Filière intégrée"),
            cfg("GLASS_EMISSION_FACTOR", 850.0, "Verre", "kgCO₂e/tonne", "Matériaux", "ADEME Base Carbone® — Verre plat"),
            cfg("WOOD_EMISSION_FACTOR", -500.0, "Bois (stockage carbone)", "kgCO₂e/tonne", "Matériaux", "NF EN 16449 — Carbone biogénique"),

            // Énergie
            cfg("ENERGY_EMISSION_FACTOR", 52.0, "Mix électrique français", "kgCO₂e/MWh", "Énergie", "ADEME Base Carbone® — Mix résidentiel"),
            cfg("PARKING_EMISSION_FACTOR", 150.0, "Parking (exploitation)", "kgCO₂e/place/an", "Énergie", "ADEME — Infrastructures routières"),

            // Bâtiment
            cfg("BUILDING_LIFESPAN", 50.0, "Durée de vie de référence", "années", "Bâtiment", "RE2020 / NF EN 15978"),
            cfg("DEFAULT_CONSTRUCTION_FACTOR", 800.0, "Estimation construction (si pas de matériaux)", "kgCO₂e/m²", "Bâtiment", "Moyenne bâtiment tertiaire RE2020"),

            // Facteur d'échelle
            cfg("SCALE_BASE", 1.0, "Facteur d'échelle — base", "", "Échelle", "Modèle CO₂nscient"),
            cfg("SCALE_SMALL_BONUS", 0.3, "Facteur d'échelle — pénalité petit bâtiment", "", "Échelle", "Modèle CO₂nscient"),
            cfg("SCALE_SMALL_DECAY", 2000.0, "Facteur d'échelle — surface de décroissance (petit)", "m²", "Échelle", "Modèle CO₂nscient"),
            cfg("SCALE_LARGE_BONUS", 0.15, "Facteur d'échelle — bonus grand bâtiment", "", "Échelle", "Modèle CO₂nscient"),
            cfg("SCALE_LARGE_DECAY", 20000.0, "Facteur d'échelle — surface de décroissance (grand)", "m²", "Échelle", "Modèle CO₂nscient"),

            // Notation
            cfg("GRADE_A_THRESHOLD", 12.0, "Seuil grade A", "kgCO₂e/m²/an", "Notation", "Échelle CO₂nscient (inspirée DPE)"),
            cfg("GRADE_B_THRESHOLD", 16.0, "Seuil grade B", "kgCO₂e/m²/an", "Notation", "Échelle CO₂nscient (inspirée DPE)"),
            cfg("GRADE_C_THRESHOLD", 20.0, "Seuil grade C", "kgCO₂e/m²/an", "Notation", "Échelle CO₂nscient (inspirée DPE)"),
            cfg("GRADE_D_THRESHOLD", 25.0, "Seuil grade D", "kgCO₂e/m²/an", "Notation", "Échelle CO₂nscient (inspirée DPE)"),
            cfg("GRADE_E_THRESHOLD", 35.0, "Seuil grade E", "kgCO₂e/m²/an", "Notation", "Échelle CO₂nscient (inspirée DPE)"),
            cfg("GRADE_F_THRESHOLD", 50.0, "Seuil grade F", "kgCO₂e/m²/an", "Notation", "Échelle CO₂nscient (inspirée DPE)"),

            // Impact
            cfg("IMPACT_LOW_THRESHOLD", 50.0, "Seuil impact Faible", "tCO₂/an", "Impact", "Échelle CO₂nscient"),
            cfg("IMPACT_MODERATE_THRESHOLD", 200.0, "Seuil impact Modéré", "tCO₂/an", "Impact", "Échelle CO₂nscient"),
            cfg("IMPACT_HIGH_THRESHOLD", 500.0, "Seuil impact Élevé", "tCO₂/an", "Impact", "Échelle CO₂nscient"),
            cfg("IMPACT_VERY_HIGH_THRESHOLD", 2000.0, "Seuil impact Très élevé", "tCO₂/an", "Impact", "Échelle CO₂nscient"),

            // Historisation — Grid intensity
            cfg("GRID_INTENSITY_2020", 52.0, "Intensité carbone réseau 2020", "gCO₂/kWh", "Historisation", "RTE éCO2mix"),
            cfg("GRID_INTENSITY_2021", 55.0, "Intensité carbone réseau 2021", "gCO₂/kWh", "Historisation", "RTE éCO2mix"),
            cfg("GRID_INTENSITY_2022", 62.0, "Intensité carbone réseau 2022", "gCO₂/kWh", "Historisation", "RTE éCO2mix — Arrêts nucléaires"),
            cfg("GRID_INTENSITY_2023", 56.0, "Intensité carbone réseau 2023", "gCO₂/kWh", "Historisation", "RTE éCO2mix"),
            cfg("GRID_INTENSITY_2024", 52.0, "Intensité carbone réseau 2024", "gCO₂/kWh", "Historisation", "RTE éCO2mix"),
            cfg("GRID_INTENSITY_2025", 50.0, "Intensité carbone réseau 2025", "gCO₂/kWh", "Historisation", "RTE éCO2mix — Projection"),

            // Équivalences
            cfg("EQUIV_FLIGHT_KG", 1750.0, "Vol Paris–New York A/R", "kgCO₂e/vol", "Équivalences", "DGAC / ADEME"),
            cfg("EQUIV_CAR_KG_PER_KM", 0.218, "Km voiture thermique", "kgCO₂e/km", "Équivalences", "ADEME — Puits à la roue"),
            cfg("EQUIV_TREE_KG_PER_YEAR", 25.0, "Absorption arbre/an", "kgCO₂e/arbre/an", "Équivalences", "ONF — Feuillu tempéré"),
            cfg("EQUIV_HOUSEHOLD_KG", 10000.0, "Foyer français moyen", "kgCO₂e/foyer/an", "Équivalences", "ADEME — Empreinte résidentielle")
        );

        configRepo.saveAll(defaults);
        log.info("Seeded {} calculation config entries", defaults.size());
    }

    private CalculationConfig cfg(String key, Double value, String label, String unit, String category, String source) {
        CalculationConfig c = new CalculationConfig();
        c.setConfigKey(key);
        c.setConfigValue(value);
        c.setLabel(label);
        c.setUnit(unit);
        c.setCategory(category);
        c.setSource(source);
        return c;
    }
}
