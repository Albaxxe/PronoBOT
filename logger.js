const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 📂 Vérifier si le dossier logs existe, sinon le créer
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 🎯 Configuration du logger
const logger = winston.createLogger({
  level: 'info',  // Niveau de logs (info, warn, error, debug)
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`)
  ),
  transports: [
    // 🚀 Log en console avec couleurs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`)
      )
    }),
    // 📂 Log dans un fichier général
    new winston.transports.File({ filename: path.join(logDir, 'bot.log'), level: 'info' }),
    // ⚠️ Log des erreurs uniquement
    new winston.transports.File({ filename: path.join(logDir, 'errors.log'), level: 'error' })
  ]
});

module.exports = logger;
