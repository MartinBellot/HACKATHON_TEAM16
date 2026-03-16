import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Site } from '../models/site.model';

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  private API_URL = 'http://localhost:8080/api/sites';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllSites(): Observable<Site[]> {
    return this.http.get<Site[]>(this.API_URL, { headers: this.getHeaders() });
  }

  getMySites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.API_URL}/my-sites`, { headers: this.getHeaders() });
  }

  getSite(id: number): Observable<Site> {
    return this.http.get<Site>(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  createSite(site: Site): Observable<Site> {
    return this.http.post<Site>(this.API_URL, site, { headers: this.getHeaders() });
  }

  updateSite(id: number, site: Site): Observable<Site> {
    return this.http.put<Site>(`${this.API_URL}/${id}`, site, { headers: this.getHeaders() });
  }

  deleteSite(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  compareSites(id1: number, id2: number): Observable<any> {
    return this.http.get(`${this.API_URL}/compare/${id1}/${id2}`, { headers: this.getHeaders() });
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.API_URL}/stats`, { headers: this.getHeaders() });
  }
}
