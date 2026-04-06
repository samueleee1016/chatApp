# 💬 ChatApp - Real-time Chat Application

Un'applicazione di messaggistica istantanea real-time costruita con Node.js, WebSocket e MySQL. Supporta chat 1-to-1, notifiche push, indicatori di lettura, typing indicator, e gestione account completa.

![ChatApp Homepage Preview](./screenshots/homepage.png)
![ChatApp Registration Preview](./screenshots/registrazione.png)
![ChatApp Login Preview](./screenshots/login_1.png)
![ChatApp Login Preview](./screenshots/login_2.png)
![ChatApp User Homepage Preview](./screenshots/homepage_utente_1.png)
![ChatApp User Homepage Preview](./screenshots/homepage_utente_2.png)
![ChatApp Notifications Preview](./screenshots/notifiche.png)
![ChatApp Chat Preview](./screenshots/chat_1.png)
![ChatApp Chat Preview](./screenshots/chat_2.png)
![ChatApp Chat Preview](./screenshots/chat_3.png)

## 📋 Indice
- [Caratteristiche](#-caratteristiche)
- [Tecnologie](#️-tecnologie)
- [Prerequisiti](#-prerequisiti)
- [Installazione](#-installazione)
- [Configurazione](#️-configurazione)
- [Utilizzo](#-utilizzo)
- [Struttura del progetto](#-struttura-del-progetto)
- [WebSocket Events](#-websocket-events)
- [Security Features](#️-security-features)
- [Rate Limiting](#-rate-limiting)
- [Deploy](#-deploy)
- [Roadmap](#-roadmap)
- [Autore](#-autore)

## ✨ Caratteristiche

### Core Features
- ✅ **Registrazione e Login** con autenticazione sicura (bcrypt)
- ✅ **Chat Real-time** via WebSocket
- ✅ **Notifiche Push** per nuovi messaggi e chat
- ✅ **Read Receipts** (doppia spunta stile WhatsApp)
- ✅ **Typing Indicator** ("sta scrivendo...")
- ✅ **Reply ai messaggi** (threading delle conversazioni)
- ✅ **Ricerca utenti** con debouncing
- ✅ **Indicatori presenza** (online/offline)
- ✅ **Sistema notifiche** con badge numero messaggi non letti
- ✅ **Eliminazione account** con verifica multi-step e password

### Security & Performance
- 🔒 Password hashing con **bcrypt** (10 rounds)
- 🛡️ **Rate limiting** multi-livello (Redis + custom Map)
- ⚡ **WebSocket** per comunicazione real-time efficiente
- 🔐 **Session management** con express-session
- 🚫 **SQL injection protection** (prepared statements)
- ⏱️ **Timing attack prevention** su login e delete account
- 📊 **Console logging** per monitoring operazioni critiche

## 🛠️ Tecnologie

### Backend
- **Node.js** (v18+) - Runtime JavaScript
- **Express.js** (v5.2.1) - Web framework
- **MySQL2** (v3.16.0) - Database relazionale
- **WebSocket (ws)** (v8.18.3) - Comunicazione real-time
- **Redis** (v5.11.0) - Cache e rate limiting store
- **Bcrypt** (v6.0.0) - Password hashing
- **express-rate-limit** (v8.2.1) - Rate limiting middleware
- **express-session** (v1.19.0) - Session management
- **dotenv** (v17.2.3) - Environment variables

### Frontend
- **HTML5/CSS3** - Markup e styling
- **JavaScript Vanilla** - Logica client-side
- **WebSocket API** - Connessione real-time
- **CSS Animations** - Typing indicator animato

### Development
- **Nodemon** (v3.1.11) - Auto-restart su modifiche

## 📦 Prerequisiti

Prima di iniziare, assicurati di avere installato:

- [Node.js](https://nodejs.org/) v18 o superiore
- [MySQL](https://www.mysql.com/) v8 o superiore
- [Redis](https://redis.io/) v6 o superiore
- [Git](https://git-scm.com/) per clonare il repository

### Verifica installazioni
```bash
node --version  # v18.0.0+
npm --version   # v9.0.0+
mysql --version # v8.0.0+
redis-server --version # v6.0.0+
```

## 🚀 Installazione

### 1. Clona il repository
```bash
git clone https://github.com/samueleee1016/chatApp.git
cd chatApp
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Configura il database MySQL

Crea il database e importa lo schema:
```bash
# Accedi a MySQL
mysql -u root -p

# Crea il database
CREATE DATABASE chatApp;
USE chatApp;

# Importa lo schema
source schema.sql;
```

### 4. Avvia Redis
```bash
# macOS (con Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Windows (con installer)
redis-server

# Verifica che Redis sia attivo
redis-cli ping
# Risposta: PONG
```

## ⚙️ Configurazione

### Crea il file .env

Copia il file `.env.example` e rinominalo in `.env`:
```bash
cp .env.example .env
```

Modifica il file `.env` con le tue configurazioni:

```env
# ================================
# DATABASE CONFIGURATION
# ================================
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=chatApp
DB_PORT=3306
DB_WAITFORCONNECTIONS=true
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

# ================================
# REDIS CONFIGURATION
# ================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # lascia vuoto se no password

# ================================
# SESSION CONFIGURATION
# ================================
SECRET_SESSION=your_secret_session_key_here
# Genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ================================
# BCRYPT CONFIGURATION
# ================================
SALT_ROUNDS=10

# ================================
# SERVER CONFIGURATION
# ================================
PORT=3000
NODE_ENV=development  # development o production
```

### ⚠️ Note sulla sicurezza
- **NON** committare mai il file `.env` su Git
- Genera `SECRET_SESSION` univoca per ogni ambiente
- In produzione, usa `NODE_ENV=production`
- Cambia le password di default

## 💻 Utilizzo

### Avvia l'applicazione

```bash
# Development (con auto-restart)
npm start

# Production
NODE_ENV=production node main.js
```

L'applicazione sarà disponibile su: **http://localhost:3000**

### Workflow tipico

1. **Registrazione**: Crea un nuovo account con username e password
2. **Login**: Accedi con le tue credenziali
3. **Cerca utenti**: Trova altri utenti per avviare una chat
4. **Crea chat**: Click su un utente per iniziare una nuova conversazione
5. **Messaggia**: Invia messaggi real-time, rispondi, vedi quando vengono letti
6. **Notifiche**: Ricevi notifiche push per nuovi messaggi
7. **Gestione account**: Elimina il tuo account quando necessario

### Eliminazione Account

**Feature completa con sicurezza multi-livello:**

1. **Accesso**: Click sull'icona cestino (🗑️) nella homepage utente
2. **Tooltip**: Hover sull'icona mostra informazioni sulla feature
3. **Step 1 - Prima conferma**: "Sei sicuro di voler eliminare il tuo account?"
4. **Step 2 - Verifica password**: Inserisci la tua password per confermare
5. **Step 3 - Conferma finale**: Ultimo passo prima dell'eliminazione permanente
6. **Redirect**: Dopo eliminazione, redirect automatico alla homepage

**Security features:**
- ✅ Verifica password con bcrypt
- ✅ Rate limiting (3 tentativi / 5 minuti)
- ✅ Timing attack prevention (FAKE_HASH)
- ✅ Multi-step confirmation (previene click accidentali)
- ✅ Notifica WebSocket agli utenti coinvolti
- ✅ Eliminazione completa dati (messaggi, chat, notifiche)
- ✅ Transazione atomica database

## 📁 Struttura del progetto

```
chatApp/
│
├── controllers/              # Controller HTTP
│   └── controller.js        # Gestione richieste (login, registrazione, delete account)
│
├── db/                       # Database configuration
│   └── pool.js              # Connection pool MySQL
│
├── errors/                   # Error handling
│   └── httpError.js         # Custom HTTP error class
│
├── middlewares/              # Middleware Express e utility
│   ├── checkRegistration.middleware.js
│   ├── checkRegistrationDataChars.js
│   ├── error.middleware.js
│   ├── hashPassword.function.js      # Bcrypt utilities
│   ├── rateLimiter.function.js       # Rate limiters (Redis + delete account)
│   └── wsLoginLimiter.js             # Custom Map rate limiter (login + delete)
│
├── public/                   # File statici (client-side)
│   ├── css/                 # Stili CSS
│   │   ├── homepage.css
│   │   ├── homepageUtente.css
│   │   ├── login.css
│   │   ├── myChat.css
│   │   └── registrazione.css
│   │
│   ├── js/                  # JavaScript client-side
│   │   ├── config.js        # Configurazione URL dinamici
│   │   ├── homepageUtente.js # Include gestione delete account
│   │   ├── login.js
│   │   ├── myChat.js
│   │   └── registrazione.js
│   │
│   ├── limiterResponse/     # Pagine HTML errore rate limit
│   │   ├── rispostaGlobalLimiter.html
│   │   ├── rispostaRateLimitRegistrazione.html
│   │   └── rispostaDeleteLimiter.html  # Rate limit delete account
│   │
│   ├── homepage.html        # Landing page
│   ├── homepageUtente.html  # Dashboard utente (con delete account)
│   ├── login.html           # Pagina registrazione
│   ├── registrazione.html   # Pagina accesso
│   ├── myChat.html          # Interfaccia chat
│   └── getAll.html          # 404 custom
│
├── routes/                   # Route Express
│   └── routes.js            # Definizione endpoint (include DELETE /deleteAccount)
│
├── services/                 # Business logic
│   └── service.js           # Servizi (registrazione, delete account)
│
├── ws/                       # WebSocket management
│   ├── socket.js            # WebSocket server setup
│   └── socket.functions.js  # Logica WebSocket (messaggi, notifiche, delete password check)
│
├── .env                      # Variabili d'ambiente (NON committare!)
├── .env.example             # Template variabili d'ambiente
├── .gitignore               # File da ignorare su Git
├── main.js                  # Entry point applicazione
├── package.json             # Dipendenze npm
├── package-lock.json        # Lock file dipendenze
├── README.md                # Questo file
└── schema.sql               # Schema database MySQL
```

## 🔌 WebSocket Events

### Client → Server

| Event | Descrizione | Payload |
|-------|-------------|---------|
| `INIT` | Inizializza connessione utente | `{username, from: "homepage"/"chat"}` |
| `CHECK_USERNAME` | Verifica disponibilità username | `{username}` |
| `VALIDATE_ACCESS` | Verifica credenziali login | `{username, psw}` |
| `NEW_MESSAGE` | Invia nuovo messaggio | `{message, sentFrom, sentTo, responseToMessageId?, responseToMessageContent?}` |
| `LOAD_MESSAGES` | Carica messaggi di una chat | `{myUsername, otherUsername}` |
| `GET_CHATS` | Carica lista chat utente | `{username, actualChat?}` |
| `ADD_NEW_CHAT` | Crea nuova chat con utente | `{username1, username2}` |
| `GET_UTENTI` | Ricerca utenti | `{search, username}` |
| `LOAD_NOTIFICATIONS` | Carica notifiche utente | `{username}` |
| `REMOVE_NOTIFICATIONS` | Segna notifiche come lette | `{username, id?}` |
| `MESSAGE_READ` | Segna messaggio come letto | `{id, otherUsername}` |
| `CHECK_USERS_STATUS` | Verifica stato online utenti | `{users: []}` |
| `GET_NOTIFICATIONS_CHAT` | Conta messaggi non letti per chat | `{users: [], myUsername}` |
| `IM_TYPING` | Notifica "sta scrivendo" | `{myUsername, otherUsername}` |
| `IM_NOT_TYPING` | Notifica "ha smesso di scrivere" | `{myUsername, otherUsername}` |
| `CHECK_PSW_FOR_DELETE` | Verifica password per eliminazione account | `{psw, username}` |

### Server → Client

| Event | Descrizione | Payload |
|-------|-------------|---------|
| `RESULT_VERIFY_ACCESS` | Risposta login | `{success: boolean, rateLimit?: {...}}` |
| `RETURN_CHECK_USERNAME` | Risposta verifica username | `{result: "username_ok"/"username_alredy_exist"}` |
| `LOAD_CHAT_AFTER_MESSAGE` | Aggiorna chat dopo invio messaggio | `{user1, user2}` |
| `GET_MESSAGES_RETURN` | Lista messaggi chat | `{success, result: [...]}` |
| `LOAD_CHATS_RESULT` | Lista chat utente | `{success, result1?, result2?}` |
| `RESULT_GET_UTENTI` | Risultati ricerca utenti | `{result: [...]}` |
| `LOAD_NOTIFICATIONS_RESULT` | Lista notifiche | `{success, result?: [...]}` |
| `LOAD_CHATS` | Trigger ricarica lista chat | `{}` |
| `LOAD_NOTIFICATIONS` | Trigger ricarica notifiche | `{}` |
| `CHECK_USERS_STATUS_RETURN` | Stati online/offline utenti | `{usersStatus: [...]}` |
| `GET_CHAT_NOTIFICATIONS_RESULT` | Numero messaggi non letti per chat | `{notificationsNumber: [...]}` |
| `IM_TYPING_RESPONSE` | Mostra "sta scrivendo" | `{otherUsername}` |
| `IM_NOT_TYPING_RESPONSE` | Nascondi "sta scrivendo" | `{otherUsername}` |
| `ADD_MESSAGE_RESPONSE` | Conferma invio messaggio | `{}` |
| `ADD_NEW_CHAT_RESPONSE` | Conferma creazione chat | `{msg?: "chat alredy exist"}` |
| `RESULT_VERIFY_PSW_FOR_DELETE` | Risposta verifica password delete | `{success: boolean, rateLimit?: {minutiRimasti}}` |

## 🛡️ Security Features

### Password Security
- ✅ **Bcrypt hashing** con 10 rounds (configurabile via .env)
- ✅ **Timing attack prevention**: fake hash comparison su username inesistente
- ✅ **FAKE_HASH pattern** su delete account per prevenire user enumeration
- ✅ Validazione lunghezza password (6-64 caratteri)
- ✅ Validazione caratteri proibiti in password

### Delete Account Security
- ✅ **Multi-step confirmation** (3 conferme prima dell'eliminazione)
- ✅ **Password verification** con bcrypt
- ✅ **Rate limiting dedicato** (3 tentativi password / 5 minuti per username)
- ✅ **Timing attack prevention** (FAKE_HASH se username non esiste)
- ✅ **Transazione atomica** (eliminazione dati completa o rollback)
- ✅ **Notifiche WebSocket** agli utenti coinvolti
- ✅ **Console logging** per audit trail

### Rate Limiting
**Livello 1 - Global (Redis):**
```javascript
1500 richieste/minuto per IP
```

**Livello 2 - Specifici (Redis):**
- Registrazione: 5 tentativi/5 minuti
- Login: 5 tentativi/5 minuti
- Delete account HTTP: 3 tentativi/5 minuti

**Livello 3 - Custom Map (in-memory):**
- Login WebSocket: 5 tentativi/5 minuti per username
- Delete password check: 3 tentativi/5 minuti per username

**Fallback:** Se Redis non disponibile, usa Map in-memory

### Database Security
- ✅ **Prepared statements** (protezione SQL injection)
- ✅ **Connection pooling** per performance
- ✅ **Transazioni atomiche** per operazioni critiche
- ✅ **Credenziali da .env** (non hardcoded)

### Session Security
- ✅ **express-session** con Redis store
- ✅ **HttpOnly cookies** (no accesso JS)
- ✅ **Secure flag** in produzione (HTTPS)
- ✅ **Session secret** da .env

### Monitoring
- ✅ **Console logging** per operazioni critiche:
  - Tentativi login falliti
  - Rate limit hits
  - Eliminazioni account
  - Errori server

## 🚦 Rate Limiting

### Strategia Multi-Livello

**1. Global Limiter (Redis)**
```
Endpoint: Tutti
Limite: 1500 req/min per IP
Store: Redis (fallback: Map)
```

**2. Registrazione Limiter (Redis)**
```
Endpoint: POST /registrazione
Limite: 5 tentativi/5 min per IP
Risposta: HTML custom page
```

**3. Delete Account Limiter (Redis)**
```
Endpoint: DELETE /deleteAccount/:username
Limite: 3 tentativi/5 min per IP
Risposta: HTML custom page
```

**4. WebSocket Login Limiter (Map)**
```
Event: VALIDATE_ACCESS
Limite: 5 tentativi/5 min per username
Store: Custom Map in-memory
Reset: Auto dopo 5 min, o su login successo
```

**5. WebSocket Delete Password Limiter (Map)**
```
Event: CHECK_PSW_FOR_DELETE
Limite: 3 tentativi/5 min per username
Store: Custom Map in-memory
Reset: Auto dopo 5 min, o su password corretta
```

### Gestione Errori Rate Limit
- **Redis disponibile**: Limiti condivisi tra istanze
- **Redis non disponibile**: Fallback a Map (limiti per istanza)
- **Custom HTML pages**: UX migliore degli errori standard
- **JSON response**: Per chiamate API

## 🌐 Deploy

### Railway (Consigliato)

```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inizializza progetto
railway init

# Aggiungi MySQL plugin
railway add mysql

# Aggiungi Redis plugin
railway add redis

# Deploy
railway up
```

**Configura variabili d'ambiente su Railway:**
1. Dashboard → Project → Variables
2. Aggiungi tutte le variabili da `.env`
3. Railway auto-configura `DATABASE_URL` e `REDIS_URL`

**Importa schema database:**
```bash
railway run mysql --host=$MYSQLHOST --user=$MYSQLUSER --password=$MYSQLPASSWORD $MYSQLDATABASE < schema.sql
```

### Post-Deploy Checklist
- ✅ Configura tutte le variabili d'ambiente
- ✅ Importa schema database
- ✅ Testa connessione Redis
- ✅ Verifica rate limiting
- ✅ Testa registrazione e login
- ✅ Testa chat real-time
- ✅ Testa eliminazione account completa

## 🗺️ Roadmap

### Versione Attuale (v1.2)
- ✅ Chat real-time 1-to-1
- ✅ Notifiche push
- ✅ Read receipts
- ✅ Typing indicator
- ✅ Reply ai messaggi
- ✅ Rate limiting multi-livello
- ✅ Timing attack prevention
- ✅ Delete account con security multi-step

### Future Features (v2.0)
- 📸 Invio immagini e file
- 👥 Chat di gruppo
- 🔍 Ricerca messaggi
- 📱 Progressive Web App (PWA)
- 🌙 Dark mode
- 🔔 Push notifications (Service Worker)
- 📊 Analytics dashboard admin

## 👨‍💻 Autore

**Samuele Mastrovincenzo**

- 🐙 GitHub: [@samueleee1016](https://github.com/samueleee1016)

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1. Fork il progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

**⭐ Se questo progetto ti è stato utile, lascia una stella! ⭐**
