const express = require('express')
const app = express();
app.set('trust proxy', true);
const session = require('express-session');
const {RedisStore} = require('connect-redis');
const redis = require('redis');
const http = require('http');
const path = require('path');
const chatAppRoutes = require('./routes/routes');
const errorHandler = require('./middlewares/error.middleware');
const {initWebSocket} = require('./ws/socket');
const {globalLimiter} = require('./middlewares/rateLimiter.function');
const HttpError = require('./errors/httpError');
require('dotenv').config();

const server = http.createServer(app);
initWebSocket(server);

app.use(globalLimiter);

const redisConfig = {
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379
    }
};

if(process.env.REDIS_PASSWORD)
    redisConfig.password = process.env.REDIS_PASSWORD;

const redisClient = redis.createClient(redisConfig);

redisClient.on('error', (err) => {
    console.error("Redis session store error: ", err);
});
redisClient.on('connection', () => {
    console.log("Redis session store connected");
});

redisClient.connect().catch(console.error);

const SECRET = process.env.SECRET_SESSION;
if(!SECRET)
    throw new HttpError("Missing secret for express session");
app.use(session({
    store: new RedisStore({
        client: redisClient,
        prefix: 'sess:'
    }),
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/chatApp', express.static(path.join(__dirname, 'public')));
app.use('/chatApp', chatAppRoutes);
app.use(errorHandler);

const {PORT} = process.env;
if(!PORT)
    throw new HttpError("missing port");
server.listen(PORT, () => {
    console.log("Server running correctly on port ", PORT);
});