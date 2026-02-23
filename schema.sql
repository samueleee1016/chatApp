-- ============================================
-- ChatApp Database Schema
-- ============================================
-- Database per applicazione di messaggistica real-time
-- Versione: 1.0
-- Ultimo aggiornamento: 23 Febbraio 2026
-- ============================================

-- Impostazioni iniziali
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================
-- CREAZIONE DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS `chat_app` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `chat_app`;

-- ============================================
-- TABELLA: utenti
-- ============================================
-- Memorizza tutti gli utenti registrati dell'applicazione
-- ============================================

CREATE TABLE `utenti` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(30) NOT NULL,
  `password_hash` VARCHAR(72) NOT NULL COMMENT 'Bcrypt hash della password (60-72 caratteri)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data di registrazione',
  `stato` ENUM('offline', 'onlineHMP', 'onlineCHAT') NOT NULL DEFAULT 'offline' COMMENT 'Stato utente: offline, online homepage, online in chat',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Utenti registrati dell\'applicazione';

-- ============================================
-- TABELLA: chat
-- ============================================
-- Memorizza le conversazioni 1-to-1 tra utenti
-- Ogni chat è unica per coppia di utenti (non duplicati)
-- ============================================

CREATE TABLE `chat` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username_utente1` VARCHAR(30) NOT NULL COMMENT 'Primo utente della chat',
  `username_utente2` VARCHAR(30) NOT NULL COMMENT 'Secondo utente della chat',
  `user_min` VARCHAR(50) NOT NULL COMMENT 'Username lessicograficamente minore (per unicità)',
  `user_max` VARCHAR(50) NOT NULL COMMENT 'Username lessicograficamente maggiore (per unicità)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data creazione chat',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat_users` (`user_min`, `user_max`) COMMENT 'Previene chat duplicate tra stessi utenti',
  KEY `idx_username_utente1` (`username_utente1`),
  KEY `idx_username_utente2` (`username_utente2`),
  CONSTRAINT `fk_chat_utente1` FOREIGN KEY (`username_utente1`) REFERENCES `utenti` (`username`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_utente2` FOREIGN KEY (`username_utente2`) REFERENCES `utenti` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Conversazioni 1-to-1 tra utenti';

-- ============================================
-- TABELLA: messaggi
-- ============================================
-- Memorizza tutti i messaggi inviati nelle chat
-- Supporta reply ai messaggi (threading)
-- ============================================

CREATE TABLE `messaggi` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `content` VARCHAR(1000) NOT NULL COMMENT 'Contenuto del messaggio',
  `chat_id` INT NOT NULL COMMENT 'ID della chat di appartenenza',
  `sent_from` VARCHAR(30) NOT NULL COMMENT 'Username del mittente',
  `orario` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e ora di invio',
  `reply_to_message_id` INT DEFAULT NULL COMMENT 'ID del messaggio a cui si risponde (threading)',
  `reply_to_message_content` VARCHAR(1000) DEFAULT NULL COMMENT 'Preview del messaggio originale',
  `letto` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Stato lettura: 0 = non letto, 1 = letto',
  PRIMARY KEY (`id`),
  KEY `idx_chat_id` (`chat_id`),
  KEY `idx_sent_from` (`sent_from`),
  KEY `idx_reply_to_message_id` (`reply_to_message_id`),
  KEY `idx_orario` (`orario`) COMMENT 'Indice per ordinamento messaggi',
  KEY `idx_letto` (`letto`) COMMENT 'Indice per query messaggi non letti',
  CONSTRAINT `fk_messaggi_chat` FOREIGN KEY (`chat_id`) REFERENCES `chat` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_messaggi_utente` FOREIGN KEY (`sent_from`) REFERENCES `utenti` (`username`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_messaggi_reply` FOREIGN KEY (`reply_to_message_id`) REFERENCES `messaggi` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Messaggi inviati nelle chat';

-- ============================================
-- TABELLA: notifiche
-- ============================================
-- Memorizza le notifiche push per gli utenti
-- Tipi: nuovo messaggio, nuova chat
-- ============================================

CREATE TABLE `notifiche` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(30) NOT NULL COMMENT 'Destinatario della notifica',
  `testo` VARCHAR(60) NOT NULL COMMENT 'Testo descrittivo della notifica',
  `type` ENUM('new_message', 'new_chat') NOT NULL COMMENT 'Tipo di notifica',
  `letto` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Stato lettura: 0 = non letta, 1 = letta',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e ora creazione',
  `message_id` INT DEFAULT NULL COMMENT 'ID del messaggio associato (solo per new_message)',
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_letto` (`letto`) COMMENT 'Indice per query notifiche non lette',
  KEY `idx_type` (`type`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_created_at` (`created_at`) COMMENT 'Indice per ordinamento cronologico',
  CONSTRAINT `fk_notifiche_utente` FOREIGN KEY (`username`) REFERENCES `utenti` (`username`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notifiche_messaggio` FOREIGN KEY (`message_id`) REFERENCES `messaggi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notifiche push per gli utenti';

-- ============================================
-- INDICI COMPOSITI PER PERFORMANCE
-- ============================================

-- Ottimizzazione query messaggi per chat specifica
CREATE INDEX `idx_chat_orario` ON `messaggi` (`chat_id`, `orario`);

-- Ottimizzazione query notifiche non lette per utente
CREATE INDEX `idx_username_letto` ON `notifiche` (`username`, `letto`);

-- Ottimizzazione ricerca chat per utente
CREATE INDEX `idx_utente1_utente2` ON `chat` (`username_utente1`, `username_utente2`);

-- ============================================
-- DATI DI ESEMPIO (OPZIONALE - per testing)
-- ============================================
-- Decommenta le seguenti righe se vuoi inserire utenti di test
-- NOTA: Le password sono tutte "password123" (bcrypt hash)
-- ============================================

/*
INSERT INTO `utenti` (`username`, `password_hash`, `stato`) VALUES
('testuser1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'offline'),
('testuser2', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'offline'),
('testuser3', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'offline');

-- Crea una chat di esempio tra testuser1 e testuser2
INSERT INTO `chat` (`username_utente1`, `username_utente2`, `user_min`, `user_max`) VALUES
('testuser1', 'testuser2', 'testuser1', 'testuser2');

-- Inserisci un messaggio di esempio
INSERT INTO `messaggi` (`content`, `chat_id`, `sent_from`) VALUES
('Ciao! Questo è un messaggio di test.', 1, 'testuser1');

-- Crea una notifica di esempio
INSERT INTO `notifiche` (`username`, `testo`, `type`, `message_id`) VALUES
('testuser2', 'Hai un nuovo messaggio da testuser1', 'new_message', 1);
*/

-- ============================================
-- FINE SCHEMA
-- ============================================

-- Verifica creazione tabelle
SELECT 
    TABLE_NAME, 
    ENGINE, 
    TABLE_ROWS, 
    CREATE_TIME
FROM 
    information_schema.TABLES
WHERE 
    TABLE_SCHEMA = 'chat_app'
ORDER BY 
    TABLE_NAME;

-- ============================================
-- NOTE IMPORTANTI
-- ============================================
-- 1. Questo schema usa utf8mb4_unicode_ci per supportare emoji 💬
-- 2. Tutte le foreign key hanno CASCADE per pulizia automatica
-- 3. Gli indici sono ottimizzati per le query più frequenti dell'app
-- 4. Il campo password_hash supporta bcrypt (60-72 caratteri)
-- 5. Il vincolo unique_chat_users previene chat duplicate
-- ============================================
