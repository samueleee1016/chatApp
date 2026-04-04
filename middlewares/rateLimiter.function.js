const rateLimit = require('express-rate-limit');
const path = require('path');
const {RedisStore} = require('rate-limit-redis');
const redis = require('redis');
require('dotenv').config();

const {REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_PASSWORD} = process.env;

const REDIS_URL = `redis://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`

const redisClient = redis.createClient({
    // username: 'default',
    password: REDIS_PASSWORD,
    url: REDIS_URL, 
    socket: {
        host: REDIS_HOST || 'localhost',
        port: REDIS_PORT || 6379
    },
    password: undefined,
    database: parseInt(REDIS_DB) || 0
});

redisClient.on('error', (err) => {
    console.error('Errore di connessione a redis', err);
});

redisClient.on('connect', () => {
    console.log('Connesso a redis');
});

redisClient.connect().catch(err => {
    console.error("Redis connnection failed: ", err);
    console.error("Rate limiting for registration will not work");
});

exports.registerLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:register:'
    }),
    windowMs: 60 * 60 * 1000,
    max: 15,
    skip: (req) => {
        const trustedIPs = ['192.168.1.100', '10.0.0.5', '::1', '127.0.0.1'];
        return trustedIPs.includes(req.ip);
    },
    handler: (req, res) => {
        console.log("Troppi tentativi di registrazione dall'ip: ", req.ip);

        return res.status(429).sendFile(path.join(__dirname, '../public/limiterResponse/rispostaRateLimitRegistrazione.html'));
    }
});

exports.globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    validate: { xForwardedForHeader: false },
    handler: (req, res) => {
        console.log("Troppe richieste in questo minuto. Orario: ", new Date());

        return res.status(429).sendFile(path.join(__dirname, '../public/limiterResponse/rispostaGlobalLimiter.html'));
    }
});

exports.deleteLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    handler: (req, res) => {
        console.log("Troppi tentativi di eliminare un account dall'ip: ", req.ip);

        return res.status(429).sendFile(path.join(__dirname, '../public/limiterResponse/rispostaDeleteLimiter.html'));
    }
})