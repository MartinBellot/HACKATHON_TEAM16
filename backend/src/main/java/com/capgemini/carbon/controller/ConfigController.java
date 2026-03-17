package com.capgemini.carbon.controller;

import com.capgemini.carbon.model.CalculationConfig;
import com.capgemini.carbon.repository.CalculationConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConfigController {

    private final CalculationConfigRepository configRepo;

    @GetMapping
    public ResponseEntity<List<CalculationConfig>> getAll() {
        return ResponseEntity.ok(configRepo.findAllByOrderByCategoryAscConfigKeyAsc());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalculationConfig> update(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body) {
        CalculationConfig config = configRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found"));
        config.setConfigValue(body.get("configValue"));
        return ResponseEntity.ok(configRepo.save(config));
    }

    @PutMapping("/batch")
    public ResponseEntity<List<CalculationConfig>> batchUpdate(
            @RequestBody List<Map<String, Object>> updates) {
        for (Map<String, Object> u : updates) {
            Long id = ((Number) u.get("id")).longValue();
            Double value = ((Number) u.get("configValue")).doubleValue();
            configRepo.findById(id).ifPresent(c -> {
                c.setConfigValue(value);
                configRepo.save(c);
            });
        }
        return ResponseEntity.ok(configRepo.findAllByOrderByCategoryAscConfigKeyAsc());
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> reset() {
        configRepo.deleteAll();
        return ResponseEntity.ok(Map.of("message", "Config reset. Restart to re-seed defaults."));
    }
}
