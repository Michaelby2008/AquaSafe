import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CUADRILLAS, reporteDe, simularDialog } from '../../../testing/pruebas';
import { ReporteDetalle as ReporteDatos } from '../../../core/models/models';
import { ReporteDetalle } from './reporte-detalle';

describe('ReporteDetalle (panel del administrador)', () => {
  let http: HttpTestingController;

  beforeAll(() => simularDialog());

  async function crear(esAdmin: boolean, reporte: ReporteDatos = reporteDe()) {
    TestBed.configureTestingModule({
      imports: [ReporteDetalle],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } },
        { provide: AuthService, useValue: { esAdmin: () => esAdmin, usuario: () => ({ id: 1, nombre: 'Ana', rol: 'x' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ReporteDetalle);

    http.expectOne((r) => r.url.endsWith('/api/reportes/5')).flush(reporte);
    if (esAdmin) {
      http
        .expectOne((r) => r.url.endsWith('/api/cuadrillas'))
        .flush({ data: CUADRILLAS, total: 3, page: 1, limit: 50 });
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  // Responde las dos recargas que hace el componente después de una acción
  async function responderRecarga(fixture: Awaited<ReturnType<typeof crear>>, reporte: ReporteDatos) {
    http.expectOne((r) => r.url.endsWith('/api/reportes/5')).flush(reporte);
    http.expectOne((r) => r.url.endsWith('/api/cuadrillas')).flush({ data: CUADRILLAS, total: 3, page: 1, limit: 50 });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('muestra el panel al administrador con un reporte pendiente', async () => {
    const fixture = await crear(true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.panel-admin')).not.toBeNull();
    expect(el.textContent).toContain('Asignar cuadrilla');
    expect(el.textContent).toContain('Cambiar estado');
  });

  it('no pide cuadrillas ni muestra el panel al ciudadano', async () => {
    const fixture = await crear(false);
    http.expectNone((r) => r.url.endsWith('/api/cuadrillas'));
    expect(fixture.nativeElement.querySelector('.panel-admin')).toBeNull();
  });

  it('lista solo las cuadrillas disponibles y pone primero las de la zona del reporte', async () => {
    const fixture = await crear(true);
    const opciones = Array.from(fixture.nativeElement.querySelectorAll('#cuadrilla option')).map((o) =>
      (o as HTMLElement).textContent?.trim(),
    );
    expect(opciones).toEqual(['Selecciona una cuadrilla', 'Alfa (misma zona)', 'Beta']);
  });

  it('en un reporte en reparación solo ofrece pasar a resuelto', async () => {
    const fixture = await crear(true, reporteDe({ estado: 'en_reparacion' }));
    const c = fixture.componentInstance;
    expect(c.puedeAsignar()).toBe(false);
    expect(c.estadosSiguientes()).toEqual(['resuelto']);
  });

  it('en un reporte resuelto no muestra el panel', async () => {
    const fixture = await crear(true, reporteDe({ estado: 'resuelto' }));
    expect(fixture.nativeElement.querySelector('.panel-admin')).toBeNull();
  });

  it('no envía la asignación sin elegir cuadrilla', async () => {
    const fixture = await crear(true);
    fixture.componentInstance.asignar();
    http.expectNone((r) => r.url.endsWith('/asignar'));
    expect(fixture.componentInstance.formAsignar.controls.cuadrilla_id.touched).toBe(true);
  });

  it('asigna la cuadrilla, recarga el reporte y muestra el éxito', async () => {
    const fixture = await crear(true);
    const c = fixture.componentInstance;
    c.formAsignar.setValue({ cuadrilla_id: 2, notas: ' Llevar herramienta ' });
    c.asignar();

    const req = http.expectOne((r) => r.url.endsWith('/api/reportes/5/asignar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cuadrilla_id: 2, notas: 'Llevar herramienta' });
    req.flush({ mensaje: 'Cuadrilla asignada correctamente' });

    await responderRecarga(fixture, reporteDe({ estado: 'asignado' }));
    expect(c.exito()).toBe('Cuadrilla asignada correctamente');
    expect(c.reporte()?.estado).toBe('asignado');
    expect(c.formAsignar.controls.cuadrilla_id.value).toBeNull();
  });

  it('muestra el error del servidor y refresca el reporte si la asignación falla', async () => {
    const fixture = await crear(true);
    const c = fixture.componentInstance;
    c.formAsignar.patchValue({ cuadrilla_id: 2 });
    c.asignar();

    http
      .expectOne((r) => r.url.endsWith('/api/reportes/5/asignar'))
      .flush({ mensaje: 'La cuadrilla no está disponible' }, { status: 409, statusText: 'Conflict' });

    await responderRecarga(fixture, reporteDe());
    expect(c.errorAccion()).toBe('La cuadrilla no está disponible');
    expect(c.guardando()).toBe(false);
  });

  it('cambia el estado sin pedir confirmación cuando no es un rechazo', async () => {
    const fixture = await crear(true, reporteDe({ estado: 'asignado' }));
    const c = fixture.componentInstance;
    c.formEstado.setValue({ estado: 'en_reparacion', comentario: 'Cuadrilla en camino' });
    c.intentarCambioEstado();

    expect(c.dialogoRechazo()).toBe(false);
    const req = http.expectOne((r) => r.url.endsWith('/api/reportes/5/estado'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'en_reparacion', comentario: 'Cuadrilla en camino' });
    req.flush({ mensaje: 'Estado actualizado' });

    await responderRecarga(fixture, reporteDe({ estado: 'en_reparacion' }));
    expect(c.exito()).toContain('En reparación');
  });

  it('exige un motivo para rechazar y no envía nada sin él', async () => {
    const fixture = await crear(true);
    const c = fixture.componentInstance;
    c.formEstado.setValue({ estado: 'rechazado', comentario: '   ' });
    c.intentarCambioEstado();

    expect(c.dialogoRechazo()).toBe(false);
    expect(c.formEstado.controls.comentario.hasError('required')).toBe(true);
    http.expectNone((r) => r.url.endsWith('/estado'));
  });

  it('pide confirmación antes de rechazar y solo entonces envía el cambio', async () => {
    const fixture = await crear(true);
    const c = fixture.componentInstance;
    c.formEstado.setValue({ estado: 'rechazado', comentario: 'Reporte duplicado' });
    c.intentarCambioEstado();

    expect(c.dialogoRechazo()).toBe(true);
    http.expectNone((r) => r.url.endsWith('/estado'));

    c.aplicarCambioEstado();
    const req = http.expectOne((r) => r.url.endsWith('/api/reportes/5/estado'));
    expect(req.request.body).toEqual({ estado: 'rechazado', comentario: 'Reporte duplicado' });
    req.flush({ mensaje: 'Estado actualizado' });

    await responderRecarga(fixture, reporteDe({ estado: 'rechazado' }));
    expect(c.dialogoRechazo()).toBe(false);
    expect(fixture.nativeElement.querySelector('.panel-admin')).toBeNull();
  });
});
