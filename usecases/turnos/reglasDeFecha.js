 *
 * Ejercicio 9.4 — Si el lavadero abriera sucursales en dos provincias con feriados distintos:
 *  CAMBIA:
 *   - El contrato del calendario: getFeriadosDeAnios(anios, provincia), y la caché pasa a ser por año + provincia
 *     (ArgentinaDatos solo trae los nacionales: los provinciales vendrían de otra fuente o de una tabla propia).
 *   - El modelo: el turno necesita saber en qué sucursal es (columna sucursalId), y el índice único parcial
 *     probablemente también (¿la misma patente puede tener turno pendiente en dos sucursales?).
 *   - validarCalendario, createTurno y reprogramarTurno: reciben la provincia de la sucursal.
 *   - Los datos del calendario fake: feriados por provincia.
 *  NO CAMBIA:
 *   - sumarDiasHabiles, estaAusente y conSituacion: son puras y reciben la lista de feriados ya armada.
 *   - El reloj: Argentina tiene un solo huso horario (si una sucursal estuviera en otro país, hoy() y ahora()
 *     pasarían a depender de la zona de la sucursal).
 *   - Las reglas R1, R3, R4 y R5, los status codes y el container (sigue inyectando un único calendario).