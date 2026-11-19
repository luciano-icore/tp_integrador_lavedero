/**
 * DAO de turnos en memoria (array de JavaScript).
 * Devuelve copias para que nadie modifique el array interno desde afuera.
 */
import AppError from "../../errors/AppError.js";

const PENDIENTE = "Esperando el servicio";

const patenteConTurnoPendiente = () =>
  new AppError("PATENTE_CON_TURNO_PENDIENTE", "El cliente ya tiene un turno pendiente para esa patente", 409);

export default class TurnosMemoryDao {
  #turnos = [];
  #nextId = 1;

  constructor(seed = []) {
    seed.forEach((t) => this.#turnos.push({ id: this.#nextId++, reprogramaciones: 0, ...t }));
  }

  // Clase 13 — filtros opcionales que "resuelve la base" (en memoria, este método):
  //  - clienteId, estado: igualdad
  //  - desde (inclusive) y hastaAntesDe (exclusive): días "AAAA-MM-DD" comparados con la fecha del turno
  // Sin filtros devuelve todos (como antes).
  async getAll({ clienteId, estado, desde, hastaAntesDe } = {}) {
    return this.#turnos
      .filter(
        (t) =>
          (clienteId === undefined || t.clienteId === clienteId) &&
          (estado === undefined || t.estado === estado) &&
          (desde === undefined || t.fecha >= desde) &&
          (hastaAntesDe === undefined || t.fecha < hastaAntesDe)
      )
      .map((t) => ({ ...t }));
  }

  async getById(id) {
    const turno = this.#turnos.find((t) => t.id === id);
    return turno ? { ...turno } : null;
  }

  // ¿Ya hay OTRO turno pendiente del mismo cliente para la misma patente? (equivale al índice único parcial)
  #hayPendienteDuplicado({ clienteId, patente, estado }, idPropio) {
    return (
      estado === PENDIENTE &&
      this.#turnos.some(
        (t) => t.id !== idPropio && t.clienteId === clienteId && t.patente === patente && t.estado === PENDIENTE
      )
    );
  }

  async save(data) {
    // Equivalente al índice único parcial de Sequelize: chequeo y alta en el MISMO paso síncrono
    // (sin un await en el medio), así dos pedidos simultáneos no pueden pasar los dos.
    if (this.#hayPendienteDuplicado(data)) throw patenteConTurnoPendiente();
    const nuevo = { id: this.#nextId++, reprogramaciones: 0, ...data };
    this.#turnos.push(nuevo);
    return { ...nuevo };
  }

  async update(id, cambios) {
    const index = this.#turnos.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const actualizado = { ...this.#turnos[index], ...cambios, id };
    // Un cambio de patente o de estado también puede chocar con otro turno pendiente
    if (this.#hayPendienteDuplicado(actualizado, id)) throw patenteConTurnoPendiente();
    this.#turnos[index] = actualizado;
    return { ...actualizado };
  }

  // Clase 13 — R4: nueva fecha y reprogramaciones + 1, solo si sigue pendiente y nadie lo reprogramó
  // en el medio (reprogramacionesPrevias = lo que leyó el caso de uso). Devuelve null si el turno cambió.
  async reprogramar(id, { fecha, reprogramacionesPrevias }) {
    const turno = this.#turnos.find((t) => t.id === id);
    if (!turno || turno.estado !== PENDIENTE || turno.reprogramaciones !== reprogramacionesPrevias) return null;
    turno.fecha = fecha;
    turno.reprogramaciones += 1;
    return { ...turno };
  }

  async delete(id) {
    const index = this.#turnos.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.#turnos.splice(index, 1);
    return true;
  }

  // Borra todos los turnos de un cliente. Devuelve cuántos borró.
  async deleteByClienteId(clienteId) {
    const antes = this.#turnos.length;
    this.#turnos = this.#turnos.filter((t) => t.clienteId !== clienteId);
    return antes - this.#turnos.length;
  }
}