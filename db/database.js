const sqlite3 = require('sqlite3').verbose();

// Create database connection
const db = new sqlite3.Database('./corridas.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to database');
});

// Create table (if not exists)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS corridas (
      id_corrida TEXT PRIMARY KEY,
      bot_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      lat_partida TEXT NOT NULL,
      lng_partida TEXT NOT NULL,
      logs TEXT,
      get_position INTEGER DEFAULT 0,
      corrida_active INTEGER DEFAULT 1,
      current_solicitacao_status TEXT
    )
  `);
});

// Export the db instance directly
module.exports = db;