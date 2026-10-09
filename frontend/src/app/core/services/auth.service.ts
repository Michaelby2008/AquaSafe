import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Perfil } from '../models/models';

const CLAVE = 'aquasave_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = `${environment.apiUrl}/api/auth`;

  private sesion = signal<LoginResponse | null>(this.leer());
  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.sesion()?.usuario.rol === 'administrador');

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.api}/login`, { email, password }).pipe(
      tap((r) => this.guardar(r)),
    );
  }

  registro(datos: { nombre: string; email: string; telefono?: string; password: string }) {
    return this.http.post<{ mensaje: string }>(`${this.api}/registro`, datos);
  }

  obtenerPerfil() {
    return this.http.get<Perfil>(`${this.api}/perfil`);
  }

  actualizarPerfil(datos: { nombre: string; telefono?: string }) {
    return this.http.put<{ mensaje: string }>(`${this.api}/perfil`, datos);
  }

  actualizarNombreLocal(nombre: string) {
    const actual = this.sesion();
    if (actual) this.guardar({ ...actual, usuario: { ...actual.usuario, nombre } });
  }

  logout() {
    localStorage.removeItem(CLAVE);
    this.sesion.set(null);
    this.router.navigate(['/login']);
  }

  private guardar(r: LoginResponse) {
    localStorage.setItem(CLAVE, JSON.stringify(r));
    this.sesion.set(r);
  }

  private leer(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(CLAVE);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}