import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión | AquaSave',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    title: 'Crear cuenta | AquaSave',
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Inicio | AquaSave',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
    ],
  },
  {
    path: 'reportes',
    title: 'Reportes | AquaSave',
    loadComponent: () => import('./features/reportes/reportes-lista/reportes-lista').then((m) => m.ReportesLista),
  },
  {
    path: 'reportes/nuevo',
   title: 'Nuevo reporte | AquaSave',
   loadComponent: () => import('./features/reportes/reporte-form/reporte-form').then((m) => m.ReporteForm),
  },
  {
   path: 'reportes/:id/editar',
   title: 'Editar reporte | AquaSave',
   loadComponent: () => import('./features/reportes/reporte-form/reporte-form').then((m) => m.ReporteForm),
  },
  {
    path: 'reportes/:id',
    title: 'Detalle del reporte | AquaSave',
    loadComponent: () => import('./features/reportes/reporte-detalle/reporte-detalle').then((m) => m.ReporteDetalle),
  },
    {
      path: '**',
      title: 'Página no encontrada | AquaSave',
      loadComponent: () => import('./shared/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
   },
];