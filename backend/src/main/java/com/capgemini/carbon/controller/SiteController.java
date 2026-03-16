package com.capgemini.carbon.controller;

import com.capgemini.carbon.dto.SiteRequest;
import com.capgemini.carbon.dto.SiteResponse;
import com.capgemini.carbon.service.CarbonCalculationService;
import com.capgemini.carbon.service.SiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SiteController {

    private final SiteService siteService;
    private final CarbonCalculationService carbonCalculationService;

    @PostMapping
    public ResponseEntity<SiteResponse> createSite(
            @Valid @RequestBody SiteRequest request,
            Authentication authentication) {
        SiteResponse site = siteService.createSite(request, authentication.getName());
        return ResponseEntity.ok(site);
    }

    @GetMapping
    public ResponseEntity<List<SiteResponse>> getAllSites() {
        List<SiteResponse> sites = siteService.getAllSites();
        return ResponseEntity.ok(sites);
    }

    @GetMapping("/my-sites")
    public ResponseEntity<List<SiteResponse>> getMySites(Authentication authentication) {
        List<SiteResponse> sites = siteService.getUserSites(authentication.getName());
        return ResponseEntity.ok(sites);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SiteResponse> getSite(@PathVariable Long id) {
        SiteResponse site = siteService.getSite(id);
        return ResponseEntity.ok(site);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SiteResponse> updateSite(
            @PathVariable Long id,
            @Valid @RequestBody SiteRequest request,
            Authentication authentication) {
        SiteResponse site = siteService.updateSite(id, request, authentication.getName());
        return ResponseEntity.ok(site);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSite(@PathVariable Long id, Authentication authentication) {
        siteService.deleteSite(id, authentication.getName());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Site deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/compare/{id1}/{id2}")
    public ResponseEntity<CarbonCalculationService.ComparisonResult> compareSites(
            @PathVariable Long id1,
            @PathVariable Long id2) {
        var site1Response = siteService.getSite(id1);
        var site2Response = siteService.getSite(id2);

        // Créer des objets Site temporaires pour la comparaison
        var site1 = new com.capgemini.carbon.model.Site();
        site1.setName(site1Response.getName());
        site1.setTotalFootprint(site1Response.getTotalFootprint());
        site1.setConstructionFootprint(site1Response.getConstructionFootprint());
        site1.setOperationalFootprint(site1Response.getOperationalFootprint());
        site1.setFootprintPerM2(site1Response.getFootprintPerM2());

        var site2 = new com.capgemini.carbon.model.Site();
        site2.setName(site2Response.getName());
        site2.setTotalFootprint(site2Response.getTotalFootprint());
        site2.setConstructionFootprint(site2Response.getConstructionFootprint());
        site2.setOperationalFootprint(site2Response.getOperationalFootprint());
        site2.setFootprintPerM2(site2Response.getFootprintPerM2());

        CarbonCalculationService.ComparisonResult result = carbonCalculationService.compareSites(site1, site2);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<SiteResponse> allSites = siteService.getAllSites();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSites", allSites.size());

        double totalFootprint = allSites.stream()
                .mapToDouble(s -> s.getTotalFootprint() != null ? s.getTotalFootprint() : 0.0)
                .sum();
        stats.put("totalFootprint", totalFootprint);

        double avgFootprint = allSites.isEmpty() ? 0 : totalFootprint / allSites.size();
        stats.put("averageFootprint", avgFootprint);

        double avgFootprintPerM2 = allSites.stream()
                .filter(s -> s.getFootprintPerM2() != null)
                .mapToDouble(SiteResponse::getFootprintPerM2)
                .average()
                .orElse(0.0);
        stats.put("averageFootprintPerM2", avgFootprintPerM2);

        return ResponseEntity.ok(stats);
    }
}
