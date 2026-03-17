package com.capgemini.carbon.repository;

import com.capgemini.carbon.model.CalculationConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CalculationConfigRepository extends JpaRepository<CalculationConfig, Long> {
    Optional<CalculationConfig> findByConfigKey(String configKey);
    List<CalculationConfig> findAllByOrderByCategoryAscConfigKeyAsc();
}
