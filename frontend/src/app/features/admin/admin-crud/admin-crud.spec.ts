import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { simularDialog } from '../../../testing/pruebas';
import { ClaveCrud } from '../admin.config';
import { AdminCrud } from './admin-crud';

const pagina = <T>(data: T[]) => ({ data, total: data.length, page: 1, limit: 10 });

describe('AdminCrud', () => {
  let http: HttpTestingController;

  beforeAll(() => simularDialog());

  function crear(clave: ClaveCrud) {
    TestBed.configureTestingModule({
      imports: [AdminCrud],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { crud: clave } } } },
        { provide: AuthService, useValue: { usuario: () => ({ id: 1, nombre: 'Admin', rol: 'administrador' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.createComponent(AdminCrud);
  }

  const peticion = (fin: string): TestRequest => http.expectOne((r) => r.url.endsWith(fin));

  async function render(fixture: ReturnType<typeof crear>) {
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('zonas: lista los registros paginados con su estado', async () => {
    const fixture = crear('zonas');
    const req = peticion('/api/zonas');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(pagina([{ id: 1, nombre: 'Zona 1', municipio: 'Guatemala', activa: 1 }]));

    const el = await render(fixture);
    expect(el.querySelector('h1')?.textContent).toContain('Zonas');
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
    expect(el.textContent).toContain('Zona 1');
    expect(el.textContent).toContain('Sí');
    expect(el.textContent).toContain('Nueva zona');
  });

  it('muestra el mensaje de lista vacía', async () => {
    const fixture = crear('tipos-fuga');
    peticion('/api/tipos-fuga').flush(pagina([]));
    const el = await render(fixture);
    expect(el.textContent).toContain('No se encontraron registros');
    expect(el.textContent).toContain('Crea el primer tipo de fuga');
  });

  it('muestra el error de carga con opción de reintentar', async () => {
    const fixture = crear('zonas');
    peticion('/api/zonas').flush({ mensaje: 'Sesión inválida o expirada' }, { status: 401, statusText: 'Unauthorized' });
    const el = await render(fixture);
    expect(el.querySelector('.alert-error')?.textContent).toContain('Sesión inválida o expirada');
    expect(el.textContent).toContain('Reintentar');
  });

  it('no envía el formulario si faltan campos obligatorios', async () => {
    const fixture = crear('zonas');
    peticion('/api/zonas').flush(pagina([]));
    await render(fixture);
    const c = fixture.componentInstance;

    c.abrirCrear();
    c.guardar();
    http.expectNone((r) => r.method === 'POST');
    expect(c.form.controls['nombre'].touched).toBe(true);
    expect(c.form.invalid).toBe(true);
  });

  it('zonas: crea una zona con los valores del formulario y recarga la lista', async () => {
    const fixture = crear('zonas');
    peticion('/api/zonas').flush(pagina([]));
    await render(fixture);
    const c = fixture.componentInstance;

    c.abrirCrear();
    c.form.patchValue({ nombre: ' Zona 9 ', municipio: 'Mixco' });
    c.guardar();

    const req = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/api/zonas'));
    expect(req.request.body).toEqual({ nombre: 'Zona 9', municipio: 'Mixco', activa: true });
    req.flush({ id: 9, mensaje: 'Creado correctamente' });

    peticion('/api/zonas').flush(pagina([{ id: 9, nombre: 'Zona 9', municipio: 'Mixco', activa: 1 }]));
    await render(fixture);
    expect(c.exito()).toBe('Zona creada correctamente');
    expect(c.formAbierto()).toBe(false);
  });

  it('muestra el error del servidor al guardar y deja el formulario abierto', async () => {
    const fixture = crear('zonas');
    peticion('/api/zonas').flush(pagina([]));
    await render(fixture);
    const c = fixture.componentInstance;

    c.abrirCrear();
    c.form.patchValue({ nombre: 'Zona 1', municipio: 'Guatemala' });
    c.guardar();
    http
      .expectOne((r) => r.method === 'POST')
      .flush({ mensaje: 'Ya existe un registro con ese valor' }, { status: 409, statusText: 'Conflict' });

    await render(fixture);
    expect(c.errorForm()).toBe('Ya existe un registro con ese valor');
    expect(c.formAbierto()).toBe(true);
    expect(c.guardando()).toBe(false);
  });

  it('cuadrillas: muestra el nombre de la zona y envía la zona como número o null', async () => {
    const fixture = crear('cuadrillas');
    peticion('/api/zonas').flush(pagina([{ id: 4, nombre: 'Zona 4', municipio: 'Guatemala', activa: 1 }]));
    peticion('/api/cuadrillas').flush(
      pagina([{ id: 1, nombre: 'Cuadrilla Norte', telefono: '5555-1234', zona_id: 4, disponible: 0 }]),
    );
    const el = await render(fixture);
    expect(el.textContent).toContain('Zona 4');
    expect(el.textContent).toContain('Cuadrilla Norte');

    const c = fixture.componentInstance;
    c.abrirEditar(c.datos()!.data[0]);
    expect(c.form.controls['zona_id'].value).toBe('4');
    expect(c.form.controls['disponible'].value).toBe(false);

    c.form.patchValue({ zona_id: '' });
    c.guardar();
    const req = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/api/cuadrillas/1'));
    expect(req.request.body).toEqual({ nombre: 'Cuadrilla Norte', telefono: '5555-1234', zona_id: null, disponible: false });
    req.flush({ mensaje: 'Actualizado correctamente' });
  });

  it('usuarios: no permite crear ni eliminar y protege la fila del propio administrador', async () => {
    const fixture = crear('usuarios');
    peticion('/api/usuarios').flush(
      pagina([
        { id: 1, nombre: 'Admin', email: 'admin@aquasave.test', telefono: null, activo: 1, creado_en: '2026-10-01T10:00:00Z', rol: 'administrador' },
        { id: 2, nombre: 'Luis', email: 'luis@correo.com', telefono: null, activo: 1, creado_en: '2026-10-02T10:00:00Z', rol: 'ciudadano' },
      ]),
    );
    const el = await render(fixture);
    const filas = el.querySelectorAll('tbody tr');

    const botones = Array.from(el.querySelectorAll('button')).map((b) => b.textContent?.trim() ?? '');
    expect(botones.some((t) => t.startsWith('Nuevo'))).toBe(false);
    expect(botones.some((t) => t.startsWith('Eliminar'))).toBe(false);
    expect(filas[0].textContent).toContain('Eres tú');
    expect(filas[0].querySelector('button')).toBeNull();
    expect(filas[1].querySelector('button')?.textContent).toContain('Editar');
  });

  it('usuarios: cambiar el rol envía PATCH solo con rol y activo', async () => {
    const fixture = crear('usuarios');
    peticion('/api/usuarios').flush(
      pagina([{ id: 2, nombre: 'Luis', email: 'luis@correo.com', telefono: null, activo: 1, creado_en: '2026-10-02T10:00:00Z', rol: 'ciudadano' }]),
    );
    await render(fixture);
    const c = fixture.componentInstance;

    c.abrirEditar(c.datos()!.data[0]);
    c.form.patchValue({ rol: 'administrador', activo: false });
    c.guardar();

    const req = http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/api/usuarios/2'));
    expect(req.request.body).toEqual({ rol: 'administrador', activo: false });
    req.flush({ mensaje: 'Usuario actualizado' });
  });

  it('elimina tras confirmar y muestra el error si el registro está en uso', async () => {
    const fixture = crear('zonas');
    peticion('/api/zonas').flush(pagina([{ id: 1, nombre: 'Zona 1', municipio: 'Guatemala', activa: 1 }]));
    await render(fixture);
    const c = fixture.componentInstance;

    c.filaAEliminar.set(c.datos()!.data[0]);
    c.confirmarEliminar();
    http
      .expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/api/zonas/1'))
      .flush({ mensaje: 'No se puede eliminar: tiene registros relacionados' }, { status: 409, statusText: 'Conflict' });

    await render(fixture);
    expect(c.errorAccion()).toContain('tiene registros relacionados');
    expect(c.filaAEliminar()).toBeNull();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
