const mysql = require('mysql2/promise');
const HttpError = require('../errors/httpError');
require('dotenv').config();

const {DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT} = process.env;
const DB_WAITFORCONNECTIONS = process.env.DB_WAITFORCONNECTIONS === 'true';
if(!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE || !DB_PORT || !DB_WAITFORCONNECTIONS)
    throw new HttpError("Missing db credentials");
const DB_CONNECTION_LIMIT = process.env.DB_CONNECTION_LIMIT || 10;
const DB_QUEUE_LIMIT = process.env.DB_QUEUE_LIMIT || 0;
if(!DB_CONNECTION_LIMIT || isNaN(DB_CONNECTION_LIMIT) || !DB_QUEUE_LIMIT || isNaN(DB_QUEUE_LIMIT))
    throw new HttpError("Missing db credentials");

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    port: DB_PORT,
    waitForConnections: DB_WAITFORCONNECTIONS,
    connectionLimit: DB_CONNECTION_LIMIT,
    queueLimit: DB_QUEUE_LIMIT
});

module.exports = pool;