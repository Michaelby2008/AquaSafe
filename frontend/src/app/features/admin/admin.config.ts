// Configuración de las pantallas de administración.
// Un solo componente (AdminCrud) dibuja la tabla y el formulario a partir de estas descripciones.

export type ClaveCrud = 'zonas' | 'tipos-fuga' | 'cuadrillas' | 'usuarios';

export interface ColumnaConfig {
  clave: string;
  titulo: string;
  // texto (por defecto), bool (Sí/No), fecha, rol, zona (muestra el nombre de la zona a partir de su id)
  tipo?: 'texto' | 'bool' | 'fecha' | 'rol' | 'zona';
}

export interface OpcionSelect { valor: string; texto: string; }

export interface CampoConfig {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'area' | 'checkbox' | 'select';
  requerido?: boolean;
  min?: number;      // longitud mínima (texto)
  max?: number;      // longitud máxima (texto)
  ayuda?: string;
  valorInicial?: string | boolean;
  // select: lista fija o 'zonas' (se carga desde la API)
  opciones?: OpcionSelect[] | 'zonas';
  textoVacio?: string; // texto de la opción vacía de un select
}

export interface CrudConfig {
  clave: ClaveCrud;
  titulo: string;
  singular: string;       // "zona", "tipo de fuga"...
  genero: 'f' | 'm';      // para los mensajes: "Zona creada" / "Usuario actualizado"
  origen: 'catalogo' | 'usuarios';
  busqueda: string;       // texto de ayuda del buscador
  columnas: ColumnaConfig[];
  campos: CampoConfig[];
  campoNombre: string;    // columna que identifica la fila en mensajes y diálogos
  permite: { crear: boolean; editar: boolean; eliminar: boolean };
  aviso?: string;         // nota informativa sobre la pantalla
}

export const CONFIGS: Record<ClaveCrud, CrudConfig> = {
  zonas: {
    clave: 'zonas',
    titulo: 'Zonas',
    singular: 'zona',
    genero: 'f',
    origen: 'catalogo',
    busqueda: 'Buscar por nombre',
    campoNombre: 'nombre',
    permite: { crear: true, editar: true, eliminar: true },
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'municipio', titulo: 'Municipio' },
      { clave: 'activa', titulo: 'Activa', tipo: 'bool' },
    ],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre de la zona', tipo: 'texto', requerido: true, min: 2, max: 100 },
      { clave: 'municipio', etiqueta: 'Municipio', tipo: 'texto', requerido: true, min: 2, max: 100 },
      { clave: 'activa', etiqueta: 'Zona activa', tipo: 'checkbox', valorInicial: true },
    ],
  },

  'tipos-fuga': {
    clave: 'tipos-fuga',
    titulo: 'Tipos de fuga',
    singular: 'tipo de fuga',
    genero: 'm',
    origen: 'catalogo',
    busqueda: 'Buscar por nombre',
    campoNombre: 'nombre',
    permite: { crear: true, editar: true, eliminar: true },
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'descripcion', titulo: 'Descripción' },
    ],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre del tipo de fuga', tipo: 'texto', requerido: true, min: 3, max: 80 },
      { clave: 'descripcion', etiqueta: 'Descripción (opcional)', tipo: 'area', max: 255 },
    ],
  },

  cuadrillas: {
    clave: 'cuadrillas',
    titulo: 'Cuadrillas',
    singular: 'cuadrilla',
    genero: 'f',
    origen: 'catalogo',
    busqueda: 'Buscar por nombre',
    campoNombre: 'nombre',
    permite: { crear: true, editar: true, eliminar: true },
    aviso:
      'La disponibilidad cambia sola: una cuadrilla queda ocupada al asignarle un reporte y se libera cuando lo resuelve. ' +
      'Puedes corregirla a mano si hace falta.',
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'telefono', titulo: 'Teléfono' },
      { clave: 'zona_id', titulo: 'Zona', tipo: 'zona' },
      { clave: 'disponible', titulo: 'Disponible', tipo: 'bool' },
    ],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre de la cuadrilla', tipo: 'texto', requerido: true, min: 3, max: 100 },
      { clave: 'telefono', etiqueta: 'Teléfono (opcional)', tipo: 'texto', max: 20 },
      { clave: 'zona_id', etiqueta: 'Zona base (opcional)', tipo: 'select', opciones: 'zonas', textoVacio: 'Sin zona' },
      { clave: 'disponible', etiqueta: 'Disponible', tipo: 'checkbox', valorInicial: true },
    ],
  },

  usuarios: {
    clave: 'usuarios',
    titulo: 'Usuarios',
    singular: 'usuario',
    genero: 'm',
    origen: 'usuarios',
    busqueda: 'Buscar por nombre o correo',
    campoNombre: 'nombre',
    permite: { crear: false, editar: true, eliminar: false },
    aviso:
      'Los usuarios se registran solos desde la pantalla de registro. Aquí puedes cambiar su rol o desactivar su acceso. ' +
      'Un usuario desactivado conserva su sesión hasta que expire (2 horas).',
    columnas: [
      { clave: 'nombre', titulo: 'Nombre' },
      { clave: 'email', titulo: 'Correo' },
      { clave: 'rol', titulo: 'Rol', tipo: 'rol' },
      { clave: 'activo', titulo: 'Activo', tipo: 'bool' },
      { clave: 'creado_en', titulo: 'Registro', tipo: 'fecha' },
    ],
    campos: [
      {
        clave: 'rol',
        etiqueta: 'Rol',
        tipo: 'select',
        requerido: true,
        opciones: [
          { valor: 'ciudadano', texto: 'Ciudadano' },
          { valor: 'administrador', texto: 'Administrador' },
        ],
      },
      { clave: 'activo', etiqueta: 'Usuario activo (puede iniciar sesión)', tipo: 'checkbox', valorInicial: true },
    ],
  },
};
