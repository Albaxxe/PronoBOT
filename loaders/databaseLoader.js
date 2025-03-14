// loaders/databaseLoader.js
const { query } = require('../database/db');
// ↑ Ajustez le chemin selon où vous avez placé `db.js`

async function loadDatabase() {
  try {
    // Exemple : création de table(s) si non existante(s)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(100),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Vous pouvez créer d'autres tables (pronostics, etc.) ici
    // await query(`CREATE TABLE IF NOT EXISTS pronostics (...)`);

    console.log('Base de données initialisée (tables vérifiées/créées).');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la BDD :', error);
    throw error; // On relance l'erreur pour arrêter le bot si nécessaire
  }
}

module.exports = { loadDatabase };
