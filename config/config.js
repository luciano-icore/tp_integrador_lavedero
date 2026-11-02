/**
 * Configuración central de la aplicación.
 * Lee las variables de entorno y define valores por defecto.
 */
const config = {
  port: Number(process.env.PORT) || 3000,
  persistenceType: process.env.PERSISTENCE_TYPE || "memory",
  sqliteStorage: process.env.SQLITE_STORAGE || "./data/lavadero.sqlite",
  // Notificador de eventos: console | file
  notifier: {
    type: process.env.NOTIFIER_TYPE || "console",
    filePath: process.env.NOTIFIER_FILE_PATH || "./logs/eventos.log",
  },

};

export default config;