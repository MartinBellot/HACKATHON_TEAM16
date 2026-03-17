package com.capgemini.carbon.service;

import com.capgemini.carbon.dto.SiteRequest;
import com.capgemini.carbon.dto.SiteResponse;
import com.capgemini.carbon.model.Site;
import com.capgemini.carbon.model.User;
import com.capgemini.carbon.repository.SiteRepository;
import com.capgemini.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteService {

    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final CarbonCalculationService carbonCalculationService;

    @Transactional
    public SiteResponse createSite(SiteRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Site site = new Site();
        mapRequestToSite(request, site);
        site.setUser(user);

        // Calculer l'empreinte carbone
        carbonCalculationService.calculateFootprint(site);

        Site savedSite = siteRepository.save(site);
        return mapSiteToResponse(savedSite);
    }

    @Transactional
    public SiteResponse updateSite(Long id, SiteRequest request, String username) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found"));

        // Vérifier que l'utilisateur est propriétaire
        if (!site.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        mapRequestToSite(request, site);
        site.setUpdatedAt(LocalDateTime.now());

        // Recalculer l'empreinte carbone
        carbonCalculationService.calculateFootprint(site);

        Site updatedSite = siteRepository.save(site);
        return mapSiteToResponse(updatedSite);
    }

    public SiteResponse getSite(Long id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        return mapSiteToResponse(site);
    }

    public List<SiteResponse> getAllSites() {
        return siteRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapSiteToResponse)
                .collect(Collectors.toList());
    }

    public List<SiteResponse> getUserSites(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return siteRepository.findByUserId(user.getId()).stream()
                .map(this::mapSiteToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSite(Long id, String username) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found"));

        if (!site.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        siteRepository.delete(site);
    }

    private void mapRequestToSite(SiteRequest request, Site site) {
        site.setName(request.getName());
        site.setLocation(request.getLocation());
        site.setLatitude(request.getLatitude());
        site.setLongitude(request.getLongitude());
        site.setInseeCode(request.getInseeCode());
        site.setTotalSurface(request.getTotalSurface());
        site.setParkingPlaces(request.getParkingPlaces());
        site.setUndergroundParking(request.getUndergroundParking());
        site.setGroundParking(request.getGroundParking());
        site.setAerialParking(request.getAerialParking());
        site.setEnergyConsumption(request.getEnergyConsumption());
        site.setEmployees(request.getEmployees());
        site.setWorkstations(request.getWorkstations());
        site.setConcreteQuantity(request.getConcreteQuantity());
        site.setSteelQuantity(request.getSteelQuantity());
        site.setGlassQuantity(request.getGlassQuantity());
        site.setWoodQuantity(request.getWoodQuantity());
    }

    private SiteResponse mapSiteToResponse(Site site) {
        SiteResponse response = new SiteResponse();
        response.setId(site.getId());
        response.setName(site.getName());
        response.setLocation(site.getLocation());
        response.setLatitude(site.getLatitude());
        response.setLongitude(site.getLongitude());
        response.setInseeCode(site.getInseeCode());
        response.setTotalSurface(site.getTotalSurface());
        response.setParkingPlaces(site.getParkingPlaces());
        response.setUndergroundParking(site.getUndergroundParking());
        response.setGroundParking(site.getGroundParking());
        response.setAerialParking(site.getAerialParking());
        response.setEnergyConsumption(site.getEnergyConsumption());
        response.setEmployees(site.getEmployees());
        response.setWorkstations(site.getWorkstations());
        response.setConcreteQuantity(site.getConcreteQuantity());
        response.setSteelQuantity(site.getSteelQuantity());
        response.setGlassQuantity(site.getGlassQuantity());
        response.setWoodQuantity(site.getWoodQuantity());
        response.setConstructionFootprint(site.getConstructionFootprint());
        response.setOperationalFootprint(site.getOperationalFootprint());
        response.setTotalFootprint(site.getTotalFootprint());
        response.setFootprintPerM2(site.getFootprintPerM2());
        response.setFootprintPerEmployee(site.getFootprintPerEmployee());
        response.setCreatedAt(site.getCreatedAt());
        response.setUpdatedAt(site.getUpdatedAt());
        return response;
    }
}
