import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface EnterpriseResult {
  siren: string;
  nom_raison_sociale: string;
  activite_principale?: string;
  tranche_effectif_salarie?: string;
  siege?: {
    geo_adresse?: string;
    libelle_commune?: string;
    tranche_effectif_salarie?: string;
    activite_principale?: string;
    latitude?: string;
    longitude?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class SiteEnrichService {
  private readonly API = 'https://recherche-entreprises.api.gouv.fr/search';

  /** Mid-point employees per tranche_effectif_salarie code (INSEE) */
  private readonly EFFECTIF: Record<string, number> = {
    '00': 0, '01': 1, '02': 4, '03': 7,
    '11': 14, '12': 35, '21': 75, '22': 150,
    '31': 225, '32': 375, '41': 750, '42': 1500,
    '51': 3500, '52': 7500, '53': 10000
  };

  /**
   * Typical energy intensity (kWh/m²/year) per NAF sector prefix.
   * Source: ADEME sectoral average benchmarks.
   */
  private readonly NAF_ENERGY: [string, number][] = [
    ['47', 320], // Commerce de détail
    ['56', 400], // Restauration
    ['86', 450], // Santé
    ['87', 400], // Hébergement médico-social
    ['55', 280], // Hôtellerie
    ['62', 165], // IT / conseil
    ['63', 170], // Services informatiques
    ['64', 200], // Finance / banque
    ['65', 200], // Assurance
    ['10', 280], // IAA
    ['25', 350], // Fabrication de produits métalliques
    ['28', 320], // Fabrication de machines
    ['35', 250], // Production d'énergie
    ['85', 180], // Enseignement
  ];

  constructor(private http: HttpClient) {}

  /** Search for enterprises by name via the open Sirene API (api.gouv.fr). */
  search(q: string): Observable<EnterpriseResult[]> {
    if (!q || q.length < 2) return of([]);
    const url = `${this.API}?q=${encodeURIComponent(q)}&per_page=6`;
    return this.http.get<any>(url).pipe(
      map(res => (res.results ?? []) as EnterpriseResult[]),
      catchError(() => of([]))
    );
  }

  /**
   * Build a partial Site object with realistic pre-filled values
   * derived from a Sirene enterprise record.
   */
  buildSiteData(r: EnterpriseResult): Record<string, any> {
    const tranche = r.siege?.tranche_effectif_salarie ?? r.tranche_effectif_salarie ?? '';
    const employees = this.EFFECTIF[tranche] ?? 0;

    const nafCode = (r.siege?.activite_principale ?? r.activite_principale ?? '').slice(0, 2);
    const energyIntensity = this.getEnergyIntensity(nafCode); // kWh/m²/year

    const address = r.siege?.geo_adresse ?? r.siege?.libelle_commune ?? '';
    // Typical office: ~15 m² per employee; minimum 200 m²
    const totalSurface = Math.max(200, Math.round(employees * 15));
    // MWh/year = (kWh/m²/year × m²) / 1000
    const energyConsumption = Math.round(totalSurface * energyIntensity / 1000);
    const parkingPlaces = Math.round(employees * 0.3);

    // Construction materials – typical French office building ratios (t/m²):
    //   Concrete ≈ 0.50  |  Steel ≈ 0.05  |  Glass ≈ 0.015  |  Wood ≈ 0.008
    const concreteQuantity = +(totalSurface * 0.50).toFixed(0);
    const steelQuantity    = +(totalSurface * 0.05).toFixed(1);
    const glassQuantity    = +(totalSurface * 0.015).toFixed(1);
    const woodQuantity     = +(totalSurface * 0.008).toFixed(1);

    const lat = r.siege?.latitude ? parseFloat(r.siege.latitude) : undefined;
    const lon = r.siege?.longitude ? parseFloat(r.siege.longitude) : undefined;

    return {
      name: r.nom_raison_sociale,
      location: address,
      latitude: lat,
      longitude: lon,
      employees: employees || undefined,
      totalSurface,
      energyConsumption,
      parkingPlaces: parkingPlaces || undefined,
      concreteQuantity,
      steelQuantity,
      glassQuantity,
      woodQuantity,
    };
  }

  private getEnergyIntensity(nafPrefix: string): number {
    const entry = this.NAF_ENERGY.find(([p]) => nafPrefix === p);
    return entry ? entry[1] : 160; // default: bureaux génériques
  }
}
