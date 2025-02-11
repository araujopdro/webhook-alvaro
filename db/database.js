// database.js
const sqlite3 = require('sqlite3').verbose();

// Create/connect to database
const db = new sqlite3.Database('./corridas.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to database');
});

// Create table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS corridas (
      id_corrida TEXT PRIMARY KEY,
      bot_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      lat_partida TEXT NOT NULL,
      lng_partida TEXT NOT NULL,
      logs TEXT,  -- Will store JSON array
      get_position INTEGER DEFAULT 0,
      corrida_active INTEGER DEFAULT 1,
      current_solicitacao_status TEXT
    )
  `);
});

module.exports = db;