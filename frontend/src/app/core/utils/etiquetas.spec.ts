import { ESTADOS, ESTADOS_ASIGNABLES, TRANSICIONES, textoEstado, textoGravedad } from './etiquetas';

describe('etiquetas', () => {
  it('traduce estados y gravedades a texto legible', () => {
    expect(textoEstado('en_reparacion')).toBe('En reparación');
    expect(textoGravedad('critica')).toBe('Crítica');
  });

  it('devuelve el valor original si no conoce la etiqueta', () => {
    expect(textoEstado('desconocido')).toBe('desconocido');
  });

  it('define transiciones para todos los estados', () => {
    expect(Object.keys(TRANSICIONES).sort()).toEqual([...ESTADOS].sort());
  });

  it('respeta el flujo del backend', () => {
    expect(TRANSICIONES.pendiente).toEqual(['en_revision', 'rechazado']);
    expect(TRANSICIONES.en_revision).toEqual(['rechazado']);
    expect(TRANSICIONES.asignado).toEqual(['en_reparacion']);
    expect(TRANSICIONES.en_reparacion).toEqual(['resuelto']);
  });

  it('no permite salir de los estados finales ni pasar a "asignado" por cambio de estado', () => {
    expect(TRANSICIONES.resuelto).toEqual([]);
    expect(TRANSICIONES.rechazado).toEqual([]);
    for (const siguientes of Object.values(TRANSICIONES)) expect(siguientes).not.toContain('asignado');
  });

  it('solo se asigna desde pendiente o en revisión', () => {
    expect(ESTADOS_ASIGNABLES).toEqual(['pendiente', 'en_revision']);
  });
});
