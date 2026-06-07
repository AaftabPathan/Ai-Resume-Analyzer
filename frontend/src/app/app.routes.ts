// Application Router Configuration
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'analyzer',
        loadComponent: () =>
          import('./features/analyzer/analyzer').then((m) => m.AnalyzerComponent),
      },
      {
        path: 'coach',
        loadComponent: () => import('./features/coach/coach').then((m) => m.CoachComponent),
      },
      {
        path: 'builder',
        loadComponent: () => import('./features/builder/builder').then((m) => m.BuilderComponent),
      },
      {
        path: 'cover-letter',
        loadComponent: () =>
          import('./features/cover-letter/cover-letter').then((m) => m.CoverLetterComponent),
      },
      {
        path: 'recruiter',
        loadComponent: () =>
          import('./features/recruiter/recruiter').then((m) => m.RecruiterComponent),
        canActivate: [roleGuard(['recruiter', 'admin'])],
      },
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin').then((m) => m.AdminComponent),
        canActivate: [roleGuard(['admin'])],
      },
      {
        path: 'voice',
        loadComponent: () => import('./features/voice/voice').then((m) => m.VoiceComponent),
      },
      {
        path: 'mentor',
        loadComponent: () => import('./features/mentor/mentor').then((m) => m.MentorComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
