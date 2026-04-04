const pool = require('../db/pool');
const HttpError = require('../errors/httpError');
const hashPassword = require('../middlewares/hashPassword.function');
const { fSendToUser } = require('../ws/socket');

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

exports.deleteAccountService = async (username) => {
    const conn = await pool.getConnection();
    try
        {
        await conn.beginTransaction();

        let sql = "select username_utente1 from chat where username_utente2 = ?";
        const [result1] = await conn.execute(sql, [username]);
        sql = "select username_utente2 from chat where username_utente1 = ?";
        const [result2] = await conn.execute(sql, [username]);

        const sqls = [
            {sql: 'delete from notifiche where username = ?', params: [username]},
            {sql: 'delete from chat where username_utente1 = ? || username_utente2 = ?', params: [username, username]},
            {sql: 'delete from utenti where username = ?', params: [username]}
        ];
        for(item of sqls)
            await conn.execute(item.sql, item.params);

        console.log(`Account dell'utente ${username} eliminato con successo`);
        await conn.commit();

        const totLength = result1.length + result2.length;
        if(totLength > 0)
            {
            let usernames = new Array(totLength);
            for(let i=0;i<result1.length;i++)
                usernames[i] = result1[i].username_utente1;
            for(let i=result1.length;i<totLength;i++)
                usernames[i] = result2[(i-result1.length)].username_utente2;

            const dataToSend = {
                type: "LOAD_NOTIFICATIONS"
            };
            for(let i=0;i<totLength;i++)
                {
                let sql = "insert into notifiche (username, testo, type) values(?, ?, ?)";
                let params = [usernames[i], `${username} ha eliminato il suo account`, 'deleted_account'];
                await pool.execute(sql, params);
                fSendToUser(usernames[i], dataToSend);
                }
            }
        }
    catch(err)
        {
        await conn.rollback();
        console.error("error while deleting " + username + " account");
        throw new HttpError(err.message, err.status || 500);
        }
    finally
        {
        conn.release();
        }
}