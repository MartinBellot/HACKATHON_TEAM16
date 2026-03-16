package com.capgemini.carbon.repository;

import com.capgemini.carbon.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    List<Site> findByUserId(Long userId);
    List<Site> findAllByOrderByCreatedAtDesc();
}
