export interface EnvironmentalContext {
  dpe?: DpeContext;
  climate?: ClimateContext;
  transport?: TransportContext;
}

export interface DpeContext {
  nearbyBuildingsCount?: number;
  averageDpe?: number;
  dominantLabel?: string;
  distribution?: DpeDistribution[];
}

export interface DpeDistribution {
  label: string;
  count: number;
}

export interface ClimateContext {
  annualMeanTemp?: number;
  heatingDegreeDays?: number;
  coolingDegreeDays?: number;
  annualSolarRadiation?: number;
  climateZone?: string;
}

export interface TransportContext {
  busStopsNearby?: number;
  tramStopsNearby?: number;
  metroStopsNearby?: number;
  trainStationsNearby?: number;
  bikeShareNearby?: number;
  nearestStopDistance?: number;
  nearestStopName?: string;
  accessibilityScore?: string;
}

export interface YearlyFootprint {
  year: number;
  totalFootprint: number;
  constructionFootprint: number;
  operationalFootprint: number;
  footprintPerM2: number;
  gridCarbonIntensity: number;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  meanTemperature: number;
}
