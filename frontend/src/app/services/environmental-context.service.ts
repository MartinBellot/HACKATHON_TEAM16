import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EnvironmentalContext, YearlyFootprint } from '../models/environmental-context.model';

@Injectable({ providedIn: 'root' })
export class EnvironmentalContextService {
  private readonly API = '/api/sites';

  constructor(private http: HttpClient) {}

  getContext(siteId: number): Observable<EnvironmentalContext> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<EnvironmentalContext>(`${this.API}/${siteId}/environmental-context`, { headers }).pipe(
      catchError(() => of({} as EnvironmentalContext))
    );
  }

  getHistory(siteId: number): Observable<YearlyFootprint[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<YearlyFootprint[]>(`${this.API}/${siteId}/history`, { headers }).pipe(
      catchError(() => of([]))
    );
  }
}
