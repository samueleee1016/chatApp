const WebSocket = require('ws');
const socketFunctions = require('./socket.functions');
const HttpError = require('../errors/httpError');

let wss;
const clients = new Map();

exports.initWebSocket = (server) => {
    wss = new WebSocket.Server({server});

    wss.on('connection', (ws) => {
        console.log("Web socket connessa");
        ws.on('message', async (msg) => {
            try
                {
                const data = JSON.parse(msg.toString());
                if(!data || typeof(data.type) != 'string')
                    throw new HttpError("Unvalid data for web socket message", 1003);
                switch (data.type) {
                    case "INIT":
                        clients.set(data.username, ws);
                        ws.username = data.username;
                        socketFunctions.setUserOnline(data.username, data.from, exports.fSendToUser);
                        break;
                    case "CHECK_USERNAME":
                        const resultUsernameCheck = await socketFunctions.fCheckUsername(data.username);
                        ws.send(JSON.stringify(resultUsernameCheck));
                        break;
                    case "VALIDATE_ACCESS":
                        const resultValidationAccess = await socketFunctions.fValidateAccess(data.username, data.psw);
                        ws.send(JSON.stringify(resultValidationAccess));
                        break;
                    case "GET_UTENTI":
                        const resultGetUtenti = await socketFunctions.fSearchUtenti(data.search, data.username);
                        ws.send(JSON.stringify(resultGetUtenti));
                        break;
                    case "GET_CHATS":
                        const resultLoadChats = await socketFunctions.fLoadChats(data.username, data.actualChat);
                        ws.send(JSON.stringify(resultLoadChats));
                        break;
                    case "ADD_NEW_CHAT":
                        const resultAddNewChat = await socketFunctions.fAddNewChat(data.username1, data.username2, exports.fSendToUser);
                        ws.send(JSON.stringify(resultAddNewChat));
                        break;
                    case "NEW_MESSAGE":
                        const resultNewMessage = await socketFunctions.fInserMessage(data.sentFrom, data.sentTo, data.message, data.responseToMessageId, data.responseToMessageContent, exports.fSendToUser);
                        ws.send(JSON.stringify(resultNewMessage));
                        break;
                    case "LOAD_MESSAGES":
                        const resultGetMessages = await socketFunctions.fGetMessages(data.myUsername, data.otherUsername);
                        ws.send(JSON.stringify(resultGetMessages));
                        break;
                    case "LOAD_NOTIFICATIONS":
                        const resultNotifications = await socketFunctions.getUserNotifications(data.username);
                        ws.send(JSON.stringify(resultNotifications));
                        break;
                    case "REMOVE_NOTIFICATIONS":
                        const resultRemoveNotifications = await socketFunctions.fRemoveNotifications(data.username, data.id);
                        ws.send(JSON.stringify(resultRemoveNotifications));
                        break;
                    case "MESSAGE_READ":
                        const resultMessageRead = await socketFunctions.fMessageRead(data.id, data.otherUsername, exports.fSendToUser);
                        ws.send(JSON.stringify(resultMessageRead));
                        break;
                    case "CHECK_USERS_STATUS":
                        const checkUserStatusResult = await socketFunctions.checkUsersStatus(data.users);
                        ws.send(JSON.stringify(checkUserStatusResult));
                        break;
                    case "GET_NOTIFICATIONS_CHAT":
                        const getNoficationsChatResult = await socketFunctions.getNotificaionsChat(data.users, data.myUsername);
                        ws.send(JSON.stringify(getNoficationsChatResult));
                        break;
                    case "IM_TYPING":
                        await socketFunctions.fImTyping(data.myUsername, data.otherUsername, exports.fSendToUser);
                        break;
                    case "IM_NOT_TYPING":
                        await socketFunctions.fImNotTyping(data.myUsername, data.otherUsername, exports.fSendToUser);
                        break;
                    default:
                        break;
                    }
                }
            catch(err)
                {
                console.error("Error in web socket onmessage: ", err);
                throw new HttpError(err.message, err.status ?? 1011);
                }
        });
        ws.on('close', () => {
            if(ws.username)
                {
                clients.delete(ws.username);
                socketFunctions.setUserOffline(ws.username);
                }
            console.log("Web socket disconnessa");
        });

        ws.on('error', (err) => {
            console.error("Web socket error: ", err);
            throw new HttpError(err.message, err.status ?? 1011);
        });
    });
};

exports.broadcast = (data) => {
    if(!wss) return;

    const message = JSON.stringify(data);

    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN)
            client.send(message);
    });
};

exports.fSendToUser = (username, data) => {
    const ws = clients.get(username);
    if(ws && ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify(data));
}