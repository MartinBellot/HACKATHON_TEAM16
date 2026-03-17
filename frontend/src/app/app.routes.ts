import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SiteDetailComponent } from './sites/site-detail.component';
import { CompareComponent } from './compare/compare.component';
import { MethodologyComponent } from './methodology/methodology.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'site/:id', component: SiteDetailComponent },
  { path: 'compare', component: CompareComponent },
  { path: 'methodology', component: MethodologyComponent },
  { path: '**', redirectTo: '/login' }
];
