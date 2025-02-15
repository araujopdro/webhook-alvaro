const sqlite3 = require('sqlite3').verbose();
const { bot_headers } = require('../bots/credentials.js');

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
        cidade TEXT NOT NULL,
        lat_partida TEXT NOT NULL,
        lng_partida TEXT NOT NULL,
        logs TEXT,
        get_position INTEGER DEFAULT 0,
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
            WHERE current_solicitacao_status NOT IN (${placeholders})`,
            excluded_statuses,  // Pass array of statuses to exclude
            (err, rows) => {
                if (err) return reject(err);
                
                const corridas = rows.reduce((acc, row) => {
                    acc[row.id_corrida] = {
                        ...row,
                        logs: JSON.parse(row.logs),
                        get_position: Boolean(row.get_position),
                        corrida_active: Boolean(row.corrida_active),
                        bot_name: GetCredential(data.bot_id, data.cidade, 'bot_name'),
                        api_key: GetCredential(data.bot_id, data.cidade, 'api_key'),
                        auth: GetCredential(data.bot_id, data.cidade, 'auth'),
                        client_id: GetCredential(data.bot_id, data.cidade, 'client_id'),
                        client_secret: GetCredential(data.bot_id, data.cidade, 'client_secret'),
                        sendpulse_tkn: GetCredential(data.bot_id, data.cidade, 'sendpulse_tkn'),
                        
                    };
                    return acc;
                }, {});
                
        
                resolve(corridas);
            }
        );
    });
}

function UpdateCorrida(corrida) {
    return new Promise((resolve, reject) => {
        // Convert logs array to a string before storing it
        const logs_to_string = JSON.stringify(corrida.logs);

        db.run(`
            UPDATE corridas
            SET logs = ?, get_position = ?, current_solicitacao_status = ?
            WHERE id_corrida = ?`, 
            [
                logs_to_string, 
                corrida.get_position, 
                corrida.current_solicitacao_status, 
                corrida.id_corrida
            ], 
            function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
}

// Insert function example
function InsertCorrida(corrida) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO corridas (
          id_corrida,
          bot_id,
          contact_id,
          cidade,
          lat_partida,
          lng_partida,
          logs,
          get_position,
          corrida_active,
          current_solicitacao_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          corrida.id_corrida,
          corrida.bot_id,
          corrida.contact_id,
          corrida.cidade,
          corrida.lat_partida,
          corrida.lng_partida,
          JSON.stringify(corrida.logs), // Convert array to JSON string
          corrida.get_position ? 1 : 0,
          corrida.corrida_active ? 1 : 0,
          corrida.current_solicitacao_status
        ],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
}

function GetCredential(bot_id, cidade, credentials) {
    const bot_config = bot_headers[bot_id];
    if (!bot_config) return undefined;

    // Try cidade-based config first
    if (cidade && bot_config[cidade]) {
        return bot_config[cidade][credentials];
    }
    
    // Fallback to direct bot_name
    return bot_config[credentials];
}

// Export the db instance directly
module.exports = { db, GetPendingCorridas, UpdateCorrida, InsertCorrida };