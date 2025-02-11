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

async function GetPendingCorridas(excluded_statuses = ['F', 'C']) {
    return new Promise((resolve, reject) => {
      // Create placeholders for multiple statuses
      const placeholders = excluded_statuses.map(() => '?').join(', ');
      
      db.all(
            `SELECT * FROM corridas 
            WHERE current_solicitacao_status NOT IN (${placeholders})
            AND corrida_active = 1`,
            excluded_statuses,  // Pass array of statuses to exclude
            (err, rows) => {
                if (err) return reject(err);
                
                const corridas = rows.map(row => ({
                    ...row,
                    logs: JSON.parse(row.logs),
                    get_position: Boolean(row.get_position),
                    corrida_active: Boolean(row.corrida_active)
                }));
        
                resolve(corridas);
            }
        );
    });
}

// Export the db instance directly
module.exports = db;