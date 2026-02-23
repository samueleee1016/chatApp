const bcrypt = require('bcrypt');
const HttpError = require('../errors/httpError');
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
if(!SALT_ROUNDS || isNaN(SALT_ROUNDS))
    throw new HttpError('unvalid salt_rounds value');

exports.hashPassword = async (plainPassword) => {
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS)
    return hash;
}

exports.verifyPassword = async (plainPassword, hashedPassword) => {
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    return match;
}