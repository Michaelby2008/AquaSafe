import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Perfil } from './perfil';

const PERFIL = { id: 1, nombre: 'María López', email: 'maria@correo.com', telefono: null, rol: 'ciudadano' as const };

describe('Perfil', () => {
  let http: HttpTestingController;

  async function crear() {
    TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Perfil);
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/auth/perfil')).flush(PERFIL);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('carga los datos en el formulario y muestra correo y rol sin poder editarlos', async () => {
    const fixture = await crear();
    const el: HTMLElement = fixture.nativeElement;
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ nombre: 'María López', telefono: '' });
    expect(el.textContent).toContain('maria@correo.com');
    expect(el.textContent).toContain('Ciudadano');
    expect(el.querySelector('input#email')).toBeNull();
  });

  it('el botón de guardar está desactivado hasta que se cambia algo', async () => {
    const fixture = await crear();
    const boton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBe(true);

    // Se escribe en el campo como lo haría una persona, para que el formulario quede "modificado"
    const campo = fixture.nativeElement.querySelector('#nombre') as HTMLInputElement;
    campo.value = 'María J. López';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(boton.disabled).toBe(false);
  });

  it('no envía un nombre demasiado corto', async () => {
    const fixture = await crear();
    const c = fixture.componentInstance;
    c.form.controls.nombre.setValue('Ma');
    c.guardar();
    http.expectNone((r) => r.method === 'PUT');
    expect(c.form.controls.nombre.touched).toBe(true);
  });

  it('rechaza teléfonos con letras', async () => {
    const fixture = await crear();
    const c = fixture.componentInstance;
    c.form.controls.telefono.setValue('abc');
    c.guardar();
    http.expectNone((r) => r.method === 'PUT');
  });

  it('guarda el perfil y actualiza el nombre de la sesión', async () => {
    const fixture = await crear();
    const auth = TestBed.inject(AuthService);
    const espia = vi.spyOn(auth, 'actualizarNombreLocal');
    const c = fixture.componentInstance;

    c.form.setValue({ nombre: '  María J. López ', telefono: '5555-1234' });
    c.guardar();
    const req = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/api/auth/perfil'));
    expect(req.request.body).toEqual({ nombre: 'María J. López', telefono: '5555-1234' });
    req.flush({ mensaje: 'Perfil actualizado' });

    expect(espia).toHaveBeenCalledWith('María J. López');
    expect(c.exito()).toContain('actualizó correctamente');
    expect(c.perfil()?.nombre).toBe('María J. López');
  });

  it('muestra el error si el servidor rechaza los datos', async () => {
    const fixture = await crear();
    const c = fixture.componentInstance;
    c.form.controls.nombre.setValue('Otro nombre');
    c.guardar();
    http.expectOne((r) => r.method === 'PUT').flush({ mensaje: 'Datos inválidos' }, { status: 400, statusText: 'Bad Request' });
    expect(c.error()).toBe('Datos inválidos');
    expect(c.guardando()).toBe(false);
  });
});
