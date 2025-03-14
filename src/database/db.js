// db.js
const { Pool } = require('pg');

// Pool de connexions PostgreSQL
const pool = new Pool({
  user: 'albaxxe@gmail.com',
  host: '192.168.0.25',          // ou IP de la VM
  database: 'botdatabase',
  password: 'Albaxxe.Trx2005',
  port: 5432,
});

/**
 * Exécute une requête SQL
 * @param {string} text Requête SQL
 * @param {Array} params Paramètres de la requête
 * @returns {Promise} Résultat
 */
async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query };
