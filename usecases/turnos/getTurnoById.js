import AppError from "../../errors/AppError.js";
import { conSituacion } from "../../domain/situacionTurno.js";

/**
 * Caso de uso: obtener un turno por id.
 * Devuelve el turno (con su situación calculada) o null si no existe (el controller decide el 404).
 * Regla de acceso: un cliente (rol "user") solo puede ver sus propios turnos; el admin ve todos.
 */
async function getTurnoById(id, actor, { turnosDao, clock }) {
  const turno = await turnosDao.getById(id);
  if (turno && actor.rol !== "admin" && turno.clienteId !== actor.id) {
    throw new AppError("PROHIBIDO", "No tenés permiso para ver este turno", 403);
  }
  return conSituacion(turno, clock.hoy());
}

export default getTurnoById;