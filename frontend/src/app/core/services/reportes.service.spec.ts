import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  let servicio: ReportesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(ReportesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asignar envía POST /reportes/:id/asignar con cuadrilla y notas', () => {
    servicio.asignar(7, 3, 'Llevar herramienta').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/api/reportes/7/asignar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cuadrilla_id: 3, notas: 'Llevar herramienta' });
    req.flush({ mensaje: 'ok' });
  });

  it('cambiarEstado envía PATCH /reportes/:id/estado', () => {
    servicio.cambiarEstado(7, 'en_reparacion', 'En camino').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/api/reportes/7/estado'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'en_reparacion', comentario: 'En camino' });
    req.flush({ mensaje: 'ok' });
  });

  it('listar omite los filtros vacíos', () => {
    servicio.listar({ q: '', estado: 'pendiente', page: 2 }).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/api/reportes'));
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.get('estado')).toBe('pendiente');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ data: [], total: 0, page: 2, limit: 10 });
  });
});
