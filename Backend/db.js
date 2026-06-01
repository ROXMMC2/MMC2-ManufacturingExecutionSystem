const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ModelLineDB',
    password: 'Br0ther0510',
    port: 5432,
});

module.exports = pool;