const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER || process.env.SQL_USER,
  password: process.env.DB_PASSWORD || process.env.SQL_PASSWORD,
  server: process.env.DB_SERVER || process.env.SQL_SERVER,
  database: process.env.DB_NAME || process.env.SQL_DATABASE,
  port: Number(process.env.DB_PORT || process.env.SQL_PORT || 1433),
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

let poolPromise;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

module.exports = {
  sql,
  getPool
};