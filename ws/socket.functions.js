const pool = require('../db/pool');
const HttpError = require('../errors/httpError');
const hashPassword = require('../middlewares/hashPassword.function');
const {wsRateLimiter} = require('../middlewares/wsLoginLimiter');
const {wsRateLimiterDeleteAccount} = require('../middlewares/wsLoginLimiter');

exports.fCheckUsername = async (username) => {
    const sql = "select username from utenti where username = ?";
    const [result] = await pool.execute(sql, [username]);

    if(result.length == 0)
        return {
            type: "RETURN_CHECK_USERNAME",
            result: "username_ok"
        }
    else if(result[0].username === username)
        return {
            type: "RETURN_CHECK_USERNAME",
            result: "username_alredy_exist"
        }
}

exports.fValidateAccess = async (username, psw) => {
    const rateLimitCheck = wsRateLimiter.check(username);

    if(!rateLimitCheck.allowed)
        {
        const minutiRimasti = Math.ceil((rateLimitCheck.resetAt - new Date()) / 60000);
        
        return {
            type: "RESULT_VERIFY_ACCESS",
            success: false,
            rateLimit: {
                msg: "Rate limited",
                minutiRimasti: minutiRimasti,
                resetAt: rateLimitCheck.resetAt
            }
        };
        }

    const sql = "select username, password_hash from utenti where username = ?";
    const [result] = await pool.execute(sql, [username]);

    const FAKE_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const hashToCompare = (result.length > 0) ? result[0].password_hash : FAKE_HASH;

    const checkPsw = await hashPassword.verifyPassword(psw, hashToCompare);
    
    if(checkPsw && result.length > 0)
        wsRateLimiter.reset(username);

    return {
        type: "RESULT_VERIFY_ACCESS",
        success: checkPsw && result.length > 0
    };
}

exports.fSearchUtenti = async (search, username) => {
    const sql = "select username from utenti where username like ? && username != ?";
    const [result] = await pool.execute(sql, [`%${search}%`, username]);
    return {
        type: "RESULT_GET_UTENTI",
        result: result
    };
}

exports.fLoadChats = async (username, actualChat) => {
    let result1, result2, sql;
    if(!actualChat)
        {
        sql = "select id, username_utente2 from chat where username_utente1 = ?";
        [result1] = await pool.execute(sql, [username]);
        sql = "select id, username_utente1 from chat where username_utente2 = ?";
        [result2] = await pool.execute(sql, [username]);
        }
    else
        {
        let data = [username, actualChat];
        sql = "select id, username_utente2 from chat where username_utente1 = ? && username_utente2 != ?";
        [result1] = await pool.execute(sql, data);
        sql = "select id, username_utente1 from chat where username_utente2 = ? && username_utente1 != ?";
        [result2] = await pool.execute(sql, data);
        }
    
    if(!result1 && !result2)
        return {
            type: "LOAD_CHATS_RESULT",
            success: false
        };
    else if(!result1 && result2)
        return {
            type: "LOAD_CHATS_RESULT",
            success: true,
            result1: null,
            result2: result2,
        };
    else if(result1 && !result2)
        return {
            type: "LOAD_CHATS_RESULT",
            success: true,
            result1: result1,
            result2: null,
        };
    else
        return {
            type: "LOAD_CHATS_RESULT",
            success: true,
            result1: result1,
            result2: result2,
        };
}

exports.fAddNewChat = async (username1, username2, fSendToUser) => {
    const userMin = username1 < username2 ? username1 : username2;
    const userMax = username1 < username2 ? username2 : username1;
    
    let sql = "insert into chat (user_min, user_max, username_utente1, username_utente2) values(?, ?, ?, ?)";
    const data = [userMin, userMax, username1, username2];
    try
        {
        const [result] = await pool.execute(sql, data);
        }
    catch(err)
        {
        if(err.code == "ER_DUP_ENTRY")
            return {
            type: "ADD_NEW_CHAT_RESPONSE",
            msg: "chat alredy exist"
        };
        }

    fAddNotification(username2, `${username1} ha creato una nuova chat con te`, 'new_chat');
    if(await fCheckUserStatus(username2) == 'onlineHMP')
        {
        fSendToUser(username2, {type: "LOAD_NOTIFICATIONS"});
        fSendToUser(username2, {type: "LOAD_CHATS"});
        }
    return {
        type: "ADD_NEW_CHAT_RESPONSE"
    }
}

exports.fInserMessage = async (sentFrom, sentTo, message, responseToMessageId, responseToMessageContent, fSendToUser) => {
    const conn = await pool.getConnection();
    try
        {
        await conn.beginTransaction();
        if(!message)
            throw new HttpError("messaggio inesistente", 400);
        let sql = "select id from chat where (username_utente1 = ? && username_utente2 = ?) || (username_utente2 = ? && username_utente1 = ?)";
        let data = [sentFrom, sentTo, sentFrom, sentTo];
        const [resultSelect] = await conn.execute(sql, data);
        if(!resultSelect || resultSelect.length == 0)
            throw new HttpError("Error in message insering");
        let id = resultSelect[0].id;

        let resultInsert;
        if(!responseToMessageId)
            {
            sql = "insert into messaggi (content, chat_id, sent_from) values(?, ?, ?)";
            data = [message, id, sentFrom];
            [resultInsert] = await conn.execute(sql, data);
            }
        else
            {
            sql = "insert into messaggi (content, chat_id, sent_from, reply_to_message_id, reply_to_message_content) values(?, ?, ?, ?, ?)";
            data = [message, id, sentFrom, responseToMessageId, responseToMessageContent];
            [resultInsert] = await conn.execute(sql, data);
            }
        const dataToSend = {
            type: "LOAD_CHAT_AFTER_MESSAGE",
            user1: sentFrom,
            user2: sentTo
        };
        fSendToUser(sentFrom, dataToSend);

        let checkStatus = await fCheckUserStatus(sentTo);

        await fAddNotification(sentTo, `Hai un nuovo messaggio da ${sentFrom}`, 'new_message', resultInsert.insertId, conn);

        await conn.commit();
        setTimeout(() => {
            if(checkStatus == 'onlineCHAT')
                {
                fSendToUser(sentTo, { type: "LOAD_CHATS" });
                fSendToUser(sentTo, dataToSend);
                }
        }, 200);
        if(checkStatus == 'onlineHMP')
            fSendToUser(sentTo, { type: "LOAD_NOTIFICATIONS" });
        return {
            type: "ADD_MESSAGE_RESPONSE"
        };
        }
    catch(err)
        {
        await conn.rollback();
        console.error("Errore nell'inserimento di un nuovo messaggio");
        throw new HttpError(err.message, err.status ?? 500);
        }
    finally
        {
        conn.release();
        }
}

async function fCheckUserStatus(username)
    {
    const sql = "select stato from utenti where username = ?";
    const [result] = await pool.execute(sql, [username]);
    if(result.length == 0)
        throw HttpError('Unvalid username while checking status');
    return result[0].stato;
    }

async function fAddNotification(username, text, type, message_id, conn)
    {
    let sql, data, result;
    if(!message_id)
        {
        sql = "insert into notifiche (username, testo, type) values(?, ?, ?)";
        data = [username, text, type];
        [result] = await pool.execute(sql, data);
        }
    else
        {
        sql = "insert into notifiche (username, testo, type, message_id) values(?, ?, ?, ?)";
        data = [username, text, type, message_id];
        [result] = await conn.execute(sql, data);
        }
    }

exports.fGetMessages = async (myUsername, otherUsername) => {
    let sql = "select id from chat where (username_utente1 = ? && username_utente2 = ?) || (username_utente2 = ? && username_utente1 = ?)";
    let data = [myUsername, otherUsername, myUsername, otherUsername];
    const [resultGetId] = await pool.execute(sql, data);
    if(!resultGetId || resultGetId.length == 0)
        throw new HttpError("Error while getting messages");
    let id = resultGetId[0].id;

    sql = "select id, content, sent_from, orario, reply_to_message_content, letto from messaggi where chat_id = ? order by orario";
    const [resultSelect] = await pool.execute(sql, [id]);
    if(!resultSelect)
        throw new HttpError("Error while getting messages");
    else if(resultSelect.length == 0)
        return {
            type: "GET_MESSAGES_RETURN",
            success: false
        };
    return {
            type: "GET_MESSAGES_RETURN",
            success: true,
            result: resultSelect
        };
}

exports.setUserOnline = async (username, from, fSendToUser) => {
    if(!from && !username)
        throw new HttpError("error updating user status");
    if(from == "homepage")
        await fSetUserOnline('onlineHMP', username, from, fSendToUser);
    else if(from == "chat")
        await fSetUserOnline('onlineCHAT', username, from, fSendToUser);
}
async function fSetUserOnline(where, username, from, fSendToUser)
    {
    let sql, result;
    sql = 'update utenti set stato = ? where username = ?';
    [result] = await pool.execute(sql, [where, username]);

    const dataToSend = {
        type: "LOAD_CHATS"
    };
    sql = "select username_utente2 from chat where username_utente1 = ?";
    let [result2] = await pool.execute(sql, [username]);

    if(result2)
        {
        let dim = result2.length;
        for(let i=0;i<dim;i++)  
            fSendToUser(result2[i].username_utente2, dataToSend);
        }

    sql = "select username_utente1 from chat where username_utente2 = ?";
    [result2] = await pool.execute(sql, [username]);

    if(result2)
        {
        let dim = result2.length;
        for(let i=0;i<dim;i++)  
            fSendToUser(result2[i].username_utente1, dataToSend);
        }
    }

exports.setUserOffline = async (username) => {
    const sql = "update utenti set stato = 'offline' where username = ?";
    const [result] = await pool.execute(sql, [username]);
} 

exports.getUserNotifications = async (username) => {
    const sql = "select id, testo, created_at, type, message_id from notifiche where username = ? && letto = 0";
    const [result] = await pool.execute(sql, [username]);

    if(result.length == 0)
        return {
            type: "LOAD_NOTIFICATIONS_RESULT",
            success: false
        };
    
    return {
            type: "LOAD_NOTIFICATIONS_RESULT",
            success: true,
            result: result
        };
}

exports.fRemoveNotifications = async (username, id) => {
    let sql, result;
    if(id)
        {
        sql = "update notifiche set letto = 1 where username = ? && id = ?";
        let data = [username, id];
        [result] = await pool.execute(sql, data);
        }
    else
        {
        sql = "update notifiche set letto = 1 where username = ?";
        [result] = await pool.execute(sql, [username]);
        }

    return { type: "RETURN_DELETE_NOTIFICATIONS" };
}

exports.fMessageRead = async (id, otherUsername, fSendToUser) => {
    const conn = await pool.getConnection();
    try 
        {
        await conn.beginTransaction();
        let sql = "update messaggi set letto = 1 where id = ?";
        let [result1] = await conn.execute(sql, [id]);

        sql = "update notifiche set letto = 1 where message_id = ?";
        let [result] = await conn.execute(sql, [id]);
        await conn.commit();
        } 
    catch(err) 
        {
        await conn.rollback();
        console.error("Error in fMessageRead");
        throw new HttpError(err.message, err.status ?? 500);
        }
    finally
        {
        conn.release();
        }
    
    if(otherUsername && await fCheckUserStatus(otherUsername) == 'onlineCHAT')
        {
        const dataToSend = {
            type: "ADD_MESSAGE_RESPONSE"
        };
        fSendToUser(otherUsername, dataToSend);
        }
    return {
        type: "ADD_MESSAGE_RESPONSE"
    };
}

exports.checkUsersStatus = async (users) => {
    const DIM = users.length;
    let usersStatus = new Array(DIM);

    for(let i=0;i<DIM;i++)
        usersStatus[i] = await fCheckUserStatus(users[i]);

    return {
        type: "CHECK_USERS_STATUS_RETURN",
        usersStatus: usersStatus
    };
}

exports.getNotificaionsChat = async (users, myUsername) => {
    const DIM = users.length;
    let notificationsNumber = new Array(DIM);

    for(let i=0;i<DIM;i++)
        {
        let testo = `Hai un nuovo messaggio da ${users[i]}`
        
        let sql = "select count(id) as count from notifiche where type = 'new_message' && username = ? && letto = 0 && testo = ?";
        let [result] = await pool.execute(sql, [myUsername, testo]);
        notificationsNumber[i] = result[0].count;
        }

    return {
        type: "GET_CHAT_NOTIFICATIONS_RESULT",
        notificationsNumber: notificationsNumber
    };
}

exports.fImTyping = async (myUsername, otherUsername, fSendToUser) => {

    if(!myUsername || !otherUsername)
        throw new HttpError("Unvalid myUsername or otherUsername in fImTyping");

    let checkStatus = await fCheckUserStatus(otherUsername);
    if(checkStatus != 'onlineCHAT') return;
        
    const dataToSend = {
            type: "IM_TYPING_RESPONSE",
            otherUsername: myUsername
        };
    
    fSendToUser(otherUsername, dataToSend);
}

exports.fImNotTyping = async (myUsername, otherUsername, fSendToUser) => {
    if(!myUsername || !otherUsername)
        throw new HttpError("Unvalid myUsername or otherUsername in fImNotTyping");

    let checkStatus = await fCheckUserStatus(otherUsername);
    if(checkStatus != 'onlineCHAT') return;
        
    const dataToSend = {
            type: "IM_NOT_TYPING_RESPONSE",
            otherUsername: myUsername
        };
    
    fSendToUser(otherUsername, dataToSend);
}

exports.checkPswForDelete = async (psw, username) => {
    const rateLimitCheck = wsRateLimiterDeleteAccount.check(username);

    if(!rateLimitCheck.allowed)
        {
        const minutiRimasti = Math.ceil((rateLimitCheck.resetAt - new Date()) / 60000);
        
        return {
            type: "RESULT_VERIFY_PSW_FOR_DELETE",
            success: false,
            rateLimit: {
                msg: "Rate limited",
                minutiRimasti: minutiRimasti,
                resetAt: rateLimitCheck.resetAt
            }
        };
        }

    const sql = "select username, password_hash from utenti where username = ?";
    const [result] = await pool.execute(sql, [username]);

    const FAKE_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const hashToCompare = (result.length > 0) ? result[0].password_hash : FAKE_HASH;

    const checkPsw = await hashPassword.verifyPassword(psw, hashToCompare);
    
    if(checkPsw && result.length > 0)
        wsRateLimiterDeleteAccount.reset(username);

    return {
        type: "RESULT_VERIFY_PSW_FOR_DELETE",
        success: checkPsw && result.length > 0
    };
}