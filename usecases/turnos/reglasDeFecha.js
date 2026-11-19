import AppError from "../../errors/AppError.js";
import { sumarDiasHabiles, sumarDiasCorridos } from "../../domain/diasHabiles.js";

/**
 * Reglas de fecha de un turno (Clase 13). Las usan createTurno y reprogramarTurno.
 * Ninguna lee la hora ni la red por su cuenta: "ahora", "hoy" y el calendario llegan por parámetro.
 */

// No se dan turnos para un momento que ya pasó (ni para "ahora mismo"). Es barata: no consulta nada.
export function validarFechaFutura(fecha, ahora) {
  if (fecha <= ahora) {
    throw new AppError("FECHA_PASADA", `El turno ${fecha.replace("T", " ")} ya pasó: elegí un horario futuro`, 422);
  }
}

/**
 * R2 + feriados: el turno tiene que caer dentro de los próximos `diasHabiles` días hábiles
 * (sin sábados, domingos ni feriados) y no puede ser un feriado (el lavadero cierra).
 * Es la regla MÁS CARA (consulta el calendario externo): por eso se llama al final.
 *
 * Si el calendario falla con un AppError, DEGRADA con elegancia: calcula el límite solo con fines de semana,
 * no puede saber si es feriado y acepta el turno (igual que en la clase 12), informando feriadosDisponibles: false.
 * Un error que no sea AppError (un bug nuestro) no se oculta.
 *
 * @returns {{ fechaLimite: string, feriadosDisponibles: boolean }}
 */
export async function validarCalendario({ fecha, hoy, diasHabiles, calendario }) {
  // El plazo puede cruzar el fin de año: se piden todos los años que podría abarcar.
  // Cota conservadora: N días hábiles nunca ocupan más de N * 2 + 30 días corridos.
  const primerAnio = Number(hoy.slice(0, 4));
  const ultimoAnio = Number(sumarDiasCorridos(hoy, diasHabiles * 2 + 30).slice(0, 4));
  const anios = Array.from({ length: ultimoAnio - primerAnio + 1 }, (_, i) => primerAnio + i);

  let feriadoPorFecha = {};
  let feriadosDisponibles = true;
  try {
    feriadoPorFecha = await calendario.getFeriadosDeAnios(anios);
  } catch (err) {
    if (!(err instanceof AppError)) throw err;
    console.warn(`[Calendario] No disponible (${err.code}): el límite se calcula solo con fines de semana y no se controlan feriados`);
    feriadosDisponibles = false;
  }

  const dia = fecha.slice(0, 10);
  const fechaLimite = sumarDiasHabiles(hoy, diasHabiles, Object.keys(feriadoPorFecha));
  if (dia > fechaLimite) {
    throw new AppError(
      "FECHA_FUERA_DE_RANGO",
      `Los turnos se dan con hasta ${diasHabiles} días hábiles de anticipación (hasta el ${fechaLimite})`,
      422
    );
  }

  const feriado = feriadoPorFecha[dia];
  if (feriado) {
    throw new AppError("FECHA_FERIADO", `El ${feriado.fecha} es feriado (${feriado.nombre}): el lavadero está cerrado`, 422);
  }

  return { fechaLimite, feriadosDisponibles };
}