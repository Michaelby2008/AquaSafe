import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardData } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { Dashboard } from './dashboard';

const DATOS: DashboardData = {
  resumen: { total: 12, resueltos: 5, pendientes: 4, urgentes: 2, horasPromedioResolucion: 31.5 },
  porEstado: [
    { estado: 'pendiente', total: 4 },
    { estado: 'resuelto', total: 5 },
  ],
  porGravedad: [{ gravedad: 'alta', total: 6 }],
  porZona: [{ zona: 'Zona 1', total: 8 }],
  ultimos: [{ id: 3, titulo: 'Fuga en 3a avenida', gravedad: 'alta', estado: 'pendiente', creado_en: '2026-10-01T10:00:00Z' }],
  cuadrillasDisponibles: 3,
};

describe('Dashboard', () => {
  let http: HttpTestingController;

  function crear(esAdmin: boolean) {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { esAdmin: () => esAdmin, usuario: () => ({ id: 1, nombre: 'Ana', rol: 'x' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.createComponent(Dashboard);
  }

  async function render(fixture: ReturnType<typeof crear>) {
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const respuesta = () => http.expectOne((r) => r.url.endsWith('/api/dashboard'));

  it('muestra los indicadores y las cuadrillas disponibles al administrador', async () => {
    const fixture = crear(true);
    respuesta().flush(DATOS);
    const el = await render(fixture);

    expect(el.querySelectorAll('.indicadores li').length).toBe(6);
    expect(el.textContent).toContain('12');
    expect(el.textContent).toContain('31.5 h');
    expect(el.textContent).toContain('Cuadrillas disponibles');
    expect(el.textContent).toContain('Fuga en 3a avenida');
  });

  it('al ciudadano no le muestra las cuadrillas', async () => {
    const fixture = crear(false);
    respuesta().flush({ ...DATOS, cuadrillasDisponibles: null });
    const el = await render(fixture);
    expect(el.querySelectorAll('.indicadores li').length).toBe(5);
    expect(el.textContent).not.toContain('Cuadrillas disponibles');
  });

  it('calcula el ancho de las barras respecto al mayor valor', async () => {
    const fixture = crear(true);
    respuesta().flush(DATOS);
    await render(fixture);
    expect(fixture.componentInstance.porEstado().map((b) => b.porcentaje)).toEqual([80, 100]);
  });

  it('muestra un guion si todavía no hay reportes resueltos', async () => {
    const fixture = crear(true);
    respuesta().flush({ ...DATOS, resumen: { ...DATOS.resumen, horasPromedioResolucion: null } });
    const el = await render(fixture);
    expect(el.textContent).toContain('—');
  });

  it('muestra el estado vacío cuando no hay reportes', async () => {
    const fixture = crear(false);
    respuesta().flush({
      ...DATOS,
      resumen: { total: 0, resueltos: 0, pendientes: 0, urgentes: 0, horasPromedioResolucion: null },
      porEstado: [], porGravedad: [], porZona: [], ultimos: [], cuadrillasDisponibles: null,
    });
    const el = await render(fixture);
    expect(el.textContent).toContain('Todavía no hay reportes');
    expect(el.querySelector('.indicadores')).toBeNull();
  });

  it('muestra el error y permite reintentar', async () => {
    const fixture = crear(true);
    respuesta().flush({ mensaje: 'Error interno del servidor' }, { status: 500, statusText: 'Server Error' });
    let el = await render(fixture);
    expect(el.querySelector('.alert-error')?.textContent).toContain('Error interno del servidor');

    fixture.componentInstance.cargar();
    respuesta().flush(DATOS);
    el = await render(fixture);
    expect(el.querySelector('.alert-error')).toBeNull();
    expect(el.querySelectorAll('.indicadores li').length).toBe(6);
  });
});
