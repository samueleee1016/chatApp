const HttpError = require('../errors/httpError');
const path = require('path');

module.exports = (err, req, res, next) => {
    console.error("ERRORE:", err);
    if(err instanceof HttpError)
        return res.status(err.status ?? 400).json({success: false, message: err.message});
    else
        res.status(err.status ?? 500).json({success: false, message: err.message ?? "Internal server error", errno: err.errno ?? null});
};