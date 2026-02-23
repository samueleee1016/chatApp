const pool = require('../db/pool');
const HttpError = require('../errors/httpError');
const hashPassword = require('../middlewares/hashPassword.function');

exports.registrationService = async (loginData) => {
    const hashedPassword = await hashPassword.hashPassword(loginData.psw)

    const sql = "insert into utenti (username, password_hash) values (?, ?)";
    const data = [loginData.username, hashedPassword];

    try
        {
        const result = await pool.execute(sql, data);
        return result;
        }
    catch(err)
        {
        if(err.code == "ER_DUP_ENTRY")
            throw new HttpError("username già esistente");
        throw err;
        }
}