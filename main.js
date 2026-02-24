const express = require('express')
const app = express();
const session = require('express-session');
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

const SECRET = process.env.SECRET_SESSION;
if(!SECRET)
    throw new HttpError("Missing secret for express session");
app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// app.use('/chatApp', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', chatAppRoutes);
app.use(errorHandler);

const {PORT} = process.env;
if(!PORT)
    throw new HttpError("missing port");
server.listen(PORT, () => {
    console.log("Server running correctly on port ", PORT);
});