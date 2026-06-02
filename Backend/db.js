const sql = require("mssql");

// ===============================
// CONFIGURACIÓN AZURE SQL DATABASE
// ===============================
// Estas variables deben estar configuradas en Azure App Service:
// SQL_SERVER   = sqlsrv-modeline.database.windows.net
// SQL_DATABASE = sqldb-modeline
// SQL_USER     = modelinesqladmin
// SQL_PASSWORD = tu password real
// SQL_PORT     = 1433

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  port: Number(process.env.SQL_PORT || 1433),
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    console.log("Configuración Azure SQL cargada:", {
      server: process.env.SQL_SERVER || "FALTA SQL_SERVER",
      database: process.env.SQL_DATABASE || "FALTA SQL_DATABASE",
      user: process.env.SQL_USER ? "OK" : "FALTA SQL_USER",
      port: process.env.SQL_PORT || 1433
    });

    poolPromise = sql.connect(config);
  }

  return poolPromise;
}

module.exports = {
  sql,
  getPool
};