import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.page').then(m => m.HistoryPage)
  },
  {
    path: 'insights',
    loadComponent: () => import('./insights/insights.page').then(m => m.InsightsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];
