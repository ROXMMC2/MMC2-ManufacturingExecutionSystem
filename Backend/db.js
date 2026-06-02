const sql = require("mssql");

// ===============================
// CONFIGURACIÓN AZURE SQL DATABASE
// ===============================
// Variables necesarias en Azure App Service:
// SQL_SERVER
// SQL_DATABASE
// SQL_USER
// SQL_PASSWORD
// SQL_PORT

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