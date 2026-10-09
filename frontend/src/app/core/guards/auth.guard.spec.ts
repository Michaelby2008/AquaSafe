import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard, authGuard, invitadoGuard } from './auth.guard';

function ejecutar(guard: typeof authGuard, sesion: { autenticado: boolean; admin: boolean }) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { autenticado: () => sesion.autenticado, esAdmin: () => sesion.admin } },
    ],
  });
  return TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
}

function ruta(resultado: unknown): string {
  return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
}

describe('guards', () => {
  it('authGuard deja pasar con sesión y manda a /login sin sesión', () => {
    expect(ejecutar(authGuard, { autenticado: true, admin: false })).toBe(true);
    TestBed.resetTestingModule();
    expect(ruta(ejecutar(authGuard, { autenticado: false, admin: false }))).toBe('/login');
  });

  it('adminGuard deja pasar al administrador', () => {
    expect(ejecutar(adminGuard, { autenticado: true, admin: true })).toBe(true);
  });

  it('adminGuard manda al ciudadano al inicio y al visitante a /login', () => {
    expect(ruta(ejecutar(adminGuard, { autenticado: true, admin: false }))).toBe('/dashboard');
    TestBed.resetTestingModule();
    expect(ruta(ejecutar(adminGuard, { autenticado: false, admin: false }))).toBe('/login');
  });

  it('invitadoGuard saca de login a quien ya tiene sesión', () => {
    expect(ejecutar(invitadoGuard, { autenticado: false, admin: false })).toBe(true);
    TestBed.resetTestingModule();
    expect(ruta(ejecutar(invitadoGuard, { autenticado: true, admin: false }))).toBe('/dashboard');
  });
});
