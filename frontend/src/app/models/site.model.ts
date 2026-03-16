export interface Site {
  id?: number;
  name: string;
  location?: string;
  totalSurface: number;
  parkingPlaces?: number;
  undergroundParking?: number;
  groundParking?: number;
  aerialParking?: number;
  energyConsumption: number;
  employees?: number;
  workstations?: number;
  concreteQuantity?: number;
  steelQuantity?: number;
  glassQuantity?: number;
  woodQuantity?: number;
  constructionFootprint?: number;
  operationalFootprint?: number;
  totalFootprint?: number;
  footprintPerM2?: number;
  footprintPerEmployee?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
}
