package com.capgemini.carbon.service;

import com.capgemini.carbon.dto.EnvironmentalContextResponse;
import com.capgemini.carbon.dto.EnvironmentalContextResponse.*;
import com.capgemini.carbon.model.Site;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnvironmentalContextService {

    private final RestTemplate restTemplate;

    // Rayon de recherche en mètres
    private static final int DPE_RADIUS = 500;
    private static final int TRANSPORT_RADIUS = 500;

    @Cacheable(value = "environmentalContext", key = "#site.id")
    public EnvironmentalContextResponse getContext(Site site) {
        EnvironmentalContextResponse response = new EnvironmentalContextResponse();

        if (site.getLatitude() == null || site.getLongitude() == null) {
            return response;
        }

        double lat = site.getLatitude();
        double lon = site.getLongitude();

        try {
            response.setDpe(fetchDpeContext(lat, lon));
        } catch (Exception e) {
            log.warn("DPE API call failed for site {}: {}", site.getId(), e.getMessage());
        }

        try {
            response.setClimate(fetchClimateContext(lat, lon));
        } catch (Exception e) {
            log.warn("Climate API call failed for site {}: {}", site.getId(), e.getMessage());
        }

        try {
            response.setTransport(fetchTransportContext(lat, lon));
        } catch (Exception e) {
            log.warn("Transport API call failed for site {}: {}", site.getId(), e.getMessage());
        }

        return response;
    }

    // ─── DPE ADEME ──────────────────────────────────────────────────────

    private DpeContext fetchDpeContext(double lat, double lon) {
        // API ADEME DPE: existing buildings (dataset v2)
        String url = String.format(java.util.Locale.US,
            "https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines"
            + "?geo_distance=%f,%f,%d&size=200&select=classe_consommation_energie,consommation_energie",
            lat, lon, DPE_RADIUS
        );
        // Fallback to new buildings dataset if not found
        try {
            Map<String, Object> result = callApi(url);
            return parseDpeResult(result);
        } catch (Exception e) {
            // Try alternative dataset name
            String altUrl = String.format(java.util.Locale.US,
                "https://data.ademe.fr/data-fair/api/v1/datasets/dpe-tertiaire/lines"
                + "?geo_distance=%f,%f,%d&size=200&select=classe_consommation_energie,consommation_energie",
                lat, lon, DPE_RADIUS
            );
            try {
                Map<String, Object> result = callApi(altUrl);
                return parseDpeResult(result);
            } catch (Exception e2) {
                log.warn("Both DPE dataset URLs failed, returning empty DPE context");
                DpeContext dpe = new DpeContext();
                dpe.setNearbyBuildingsCount(0);
                return dpe;
            }
        }
    }

    private DpeContext parseDpeResult(Map<String, Object> result) {
        DpeContext dpe = new DpeContext();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) result.getOrDefault("results", List.of());

        if (results.isEmpty()) {
            dpe.setNearbyBuildingsCount(0);
            return dpe;
        }

        dpe.setNearbyBuildingsCount(results.size());

        // Average energy consumption
        double avgEnergy = results.stream()
            .filter(r -> r.get("consommation_energie") != null)
            .mapToDouble(r -> ((Number) r.get("consommation_energie")).doubleValue())
            .average()
            .orElse(0.0);
        dpe.setAverageDpe(Math.round(avgEnergy * 10.0) / 10.0);

        // Distribution by label
        Map<String, Long> labelCounts = results.stream()
            .map(r -> (String) r.get("classe_consommation_energie"))
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

        List<DpeDistribution> distribution = new ArrayList<>();
        for (String label : List.of("A", "B", "C", "D", "E", "F", "G")) {
            DpeDistribution d = new DpeDistribution();
            d.setLabel(label);
            d.setCount(labelCounts.getOrDefault(label, 0L).intValue());
            distribution.add(d);
        }
        dpe.setDistribution(distribution);

        // Dominant label
        dpe.setDominantLabel(
            labelCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A")
        );

        return dpe;
    }

    // ─── OPEN-METEO CLIMATE ─────────────────────────────────────────────

    private ClimateContext fetchClimateContext(double lat, double lon) {
        // Open-Meteo climate API: daily temperature + solar radiation for last year
        String url = String.format(java.util.Locale.US,
            "https://archive-api.open-meteo.com/v1/archive"
            + "?latitude=%f&longitude=%f"
            + "&start_date=2024-01-01&end_date=2024-12-31"
            + "&daily=temperature_2m_mean,shortwave_radiation_sum"
            + "&timezone=Europe/Paris",
            lat, lon
        );

        Map<String, Object> result = callApi(url);
        ClimateContext climate = new ClimateContext();

        @SuppressWarnings("unchecked")
        Map<String, Object> daily = (Map<String, Object>) result.getOrDefault("daily", Map.of());

        @SuppressWarnings("unchecked")
        List<Number> temps = (List<Number>) daily.getOrDefault("temperature_2m_mean", List.of());
        @SuppressWarnings("unchecked")
        List<Number> solar = (List<Number>) daily.getOrDefault("shortwave_radiation_sum", List.of());

        if (!temps.isEmpty()) {
            double meanTemp = temps.stream()
                .filter(Objects::nonNull)
                .mapToDouble(Number::doubleValue)
                .average()
                .orElse(0.0);
            climate.setAnnualMeanTemp(Math.round(meanTemp * 10.0) / 10.0);

            // Heating Degree Days (base 18°C)
            double hdd = temps.stream()
                .filter(Objects::nonNull)
                .mapToDouble(t -> Math.max(0, 18.0 - t.doubleValue()))
                .sum();
            climate.setHeatingDegreeDays((double) Math.round(hdd));

            // Cooling Degree Days (base 24°C)
            double cdd = temps.stream()
                .filter(Objects::nonNull)
                .mapToDouble(t -> Math.max(0, t.doubleValue() - 24.0))
                .sum();
            climate.setCoolingDegreeDays((double) Math.round(cdd));
        }

        if (!solar.isEmpty()) {
            double totalSolar = solar.stream()
                .filter(Objects::nonNull)
                .mapToDouble(Number::doubleValue)
                .sum();
            // Convert MJ/m² to kWh/m² (÷ 3.6)
            climate.setAnnualSolarRadiation(Math.round(totalSolar / 3.6 * 10.0) / 10.0);
        }

        // Climate zone estimation based on HDD
        climate.setClimateZone(estimateClimateZone(climate.getHeatingDegreeDays(), lat));

        return climate;
    }

    private String estimateClimateZone(Double hdd, double lat) {
        if (hdd == null) return "Inconnu";
        if (hdd > 2500) return lat > 47 ? "H1a" : "H1b";
        if (hdd > 2000) return "H1c";
        if (hdd > 1500) return lat > 44 ? "H2a" : "H2b";
        if (hdd > 1000) return "H2c";
        return "H3";
    }

    // ─── OVERPASS TRANSPORT ─────────────────────────────────────────────

    private TransportContext fetchTransportContext(double lat, double lon) {
        // Overpass API query for public transport stops in radius
        String overpassQuery = String.format(java.util.Locale.US,
            "[out:json][timeout:10];"
            + "("
            + "  node[\"public_transport\"=\"stop_position\"](around:%d,%f,%f);"
            + "  node[\"public_transport\"=\"platform\"](around:%d,%f,%f);"
            + "  node[\"highway\"=\"bus_stop\"](around:%d,%f,%f);"
            + "  node[\"amenity\"=\"bicycle_rental\"](around:%d,%f,%f);"
            + ");"
            + "out body;",
            TRANSPORT_RADIUS, lat, lon,
            TRANSPORT_RADIUS, lat, lon,
            TRANSPORT_RADIUS, lat, lon,
            TRANSPORT_RADIUS, lat, lon
        );

        Map<String, Object> result = callOverpass(overpassQuery);
        TransportContext transport = new TransportContext();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> elements = (List<Map<String, Object>>) result.getOrDefault("elements", List.of());

        int bus = 0, tram = 0, metro = 0, train = 0, bike = 0;
        double nearestDist = Double.MAX_VALUE;
        String nearestName = null;

        for (Map<String, Object> el : elements) {
            @SuppressWarnings("unchecked")
            Map<String, Object> tags = (Map<String, Object>) el.getOrDefault("tags", Map.of());

            String amenity = (String) tags.get("amenity");
            if ("bicycle_rental".equals(amenity)) {
                bike++;
                continue;
            }

            String routeType = detectRouteType(tags);
            switch (routeType) {
                case "bus" -> bus++;
                case "tram" -> tram++;
                case "subway" -> metro++;
                case "train" -> train++;
            }

            // Calculate distance
            Number elLat = (Number) el.get("lat");
            Number elLon = (Number) el.get("lon");
            if (elLat != null && elLon != null) {
                double dist = haversine(lat, lon, elLat.doubleValue(), elLon.doubleValue());
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestName = (String) tags.getOrDefault("name",
                        tags.getOrDefault("ref", "Arrêt sans nom"));
                }
            }
        }

        transport.setBusStopsNearby(bus);
        transport.setTramStopsNearby(tram);
        transport.setMetroStopsNearby(metro);
        transport.setTrainStationsNearby(train);
        transport.setBikeShareNearby(bike);

        if (nearestDist < Double.MAX_VALUE) {
            transport.setNearestStopDistance((double) Math.round(nearestDist));
            transport.setNearestStopName(nearestName);
        }

        // Accessibility score
        int totalStops = bus + tram + metro + train;
        if (metro > 0 || train > 0 || totalStops >= 10) {
            transport.setAccessibilityScore("Excellent");
        } else if (tram > 0 || totalStops >= 5) {
            transport.setAccessibilityScore("Bon");
        } else if (totalStops >= 2) {
            transport.setAccessibilityScore("Moyen");
        } else {
            transport.setAccessibilityScore("Faible");
        }

        return transport;
    }

    private String detectRouteType(Map<String, Object> tags) {
        String bus = (String) tags.get("bus");
        String tram = (String) tags.get("tram");
        String subway = (String) tags.get("subway");
        String train = (String) tags.get("train");
        String railway = (String) tags.get("railway");

        if ("yes".equals(subway) || "station".equals(railway)) return "subway";
        if ("yes".equals(train) || "halt".equals(railway)) return "train";
        if ("yes".equals(tram) || "tram_stop".equals(railway)) return "tram";
        if ("yes".equals(bus)) return "bus";

        // Default: check highway=bus_stop
        String highway = (String) tags.get("highway");
        if ("bus_stop".equals(highway)) return "bus";

        return "bus"; // default for public_transport nodes
    }

    // ─── UTILITIES ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> callApi(String url) {
        return restTemplate.getForObject(url, Map.class);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callOverpass(String query) {
        String url = "https://overpass-api.de/api/interpreter";
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
        String body = "data=" + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8);
        org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(body, headers);
        return restTemplate.postForObject(url, entity, Map.class);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
