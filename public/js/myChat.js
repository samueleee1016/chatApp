const ws = new WebSocket(`${WS_BASE}`);
var myUsername, otherUsername;
var chatSpanUsername = document.querySelector('#otherUsername');
var spanMyUsername = document.querySelector('#myUsername');
const chatsTable = document.querySelector('#otherChatsTable');
const messagesTable = document.querySelector('#messages');
const loadMsgErr = document.querySelector('#loadMsgErr');
const responseToMessageDiv = document.querySelector('#responseToMessageDiv');
const responseToMessagePar = document.querySelector('#responseToMessagePar');
const closeResponseToMessage = document.querySelector('#closeResponseToMessage');
const noOtherChats = document.querySelector('#noOtherChats');
const staScrivendo = document.querySelector('#staScrivendo');

closeResponseToMessage.addEventListener('click', fCloseResponseDiv);

ws.onopen = () => {
    fGetUsernames();
}

ws.onmessage = (msg) => {
    try
        {
        const data = JSON.parse(msg.data);
        if(!data || typeof(data.type) != 'string')
            throw new Error("Unvalid data for web socket message from client");
        switch (data.type) {
            case "LOAD_CHATS_RESULT":
                fLoadChatsResult(data.success, data.result1, data.result2);
                break;
            case "ADD_MESSAGE_RESPONSE":
                fLoadMessages();
                break;
            case "GET_MESSAGES_RETURN":
                loadMessage(data.success, data.result);
                break;
            case "LOAD_CHAT_AFTER_MESSAGE":
                if((data.user1 == myUsername || data.user1 == otherUsername) && (data.user2 == myUsername || data.user2 == otherUsername))
                    fLoadMessages();
                break;
            case "CHECK_USERS_STATUS_RETURN":
                fViewUsersStatus(data.usersStatus);
                break;
            case "GET_CHAT_NOTIFICATIONS_RESULT":
                fViewUsersNotificationNumber(data.notificationsNumber);
                break;
            case "LOAD_CHATS":
                fLoadChats();
                break;
            case "IM_TYPING_RESPONSE":
                fOtherUserIsTyping(data.otherUsername);
                break;
            case "IM_NOT_TYPING_RESPONSE":
                fOtherUserIsNotTyping(data.otherUsername);
                break;
            default:
                break;
        }
        }
    catch(err)
        {
        console.error("Error from web socket client (registrazione)", err);
        throw new HttpError(err.message, err.status ?? 1011);
        }
}

ws.onerror = (err) => {
    console.error("Web socket error from client: ", err);
    throw new HttpError(err.message, err.status ?? 1011);
};

var typingHideTimeout;
function fOtherUserIsTyping(otherUsernameTyping)
    {
    if(otherUsernameTyping != otherUsername) return;

    staScrivendo.removeAttribute('hidden');

    clearTimeout(typingHideTimeout);
    typingHideTimeout = setTimeout(() => {
        staScrivendo.setAttribute('hidden', 'yes');
    }, 5000);
    }

function fOtherUserIsNotTyping(otherUsernameTyping)
    {
    if(otherUsernameTyping != otherUsername) return;

    staScrivendo.setAttribute('hidden', 'yes');
    }

function fCloseResponseDiv()
    {
    responseToMessageDiv.setAttribute('hidden', 'yes');
    delete responseToMessagePar.dataset.responseId;
    responseToMessagePar.innerHTML = "";
    }

function loadMessage(success, result)
    {
    messagesTable.innerHTML = "";
    if(!success)
        {
        loadMsgErr.removeAttribute('hidden');
        return;
        }
    loadMsgErr.setAttribute('hidden', 'yes');
    
    const DIM = result.length;
    let dataAttuale = null;
    for(let i=0;i<DIM;i++)
        {
        let {data, ora} = fGetDataOra(result[i].orario);
        if(data != dataAttuale)
            {
            let oggi = fGetDataOra(new Date);

            let trData = document.createElement('tr');

            dataAttuale = data;

            let p = document.createElement('p');

            if(oggi.data == data)
                p.innerHTML = "oggi";
            else 
                p.innerHTML = data;

            p.setAttribute('class', 'date');
            trData.appendChild(p);
            messagesTable.appendChild(trData);
            }
        
        if(result[i].reply_to_message_content)
            {
            let replyRow = document.createElement('tr');
            let replyTd = document.createElement('td');
            replyTd.innerHTML = `↪️ ${result[i].reply_to_message_content}`;

            if(result[i].sent_from == myUsername)
                replyTd.setAttribute('class', 'sentByMeResponse');
            else
                replyTd.setAttribute('class', 'notSentByMeResponse');
            replyRow.appendChild(replyTd);
            messagesTable.appendChild(replyRow);
            }
        
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.setAttribute('id', result[i].id);

        let content = document.createElement('p');
        content.innerHTML = result[i].content;
        content.setAttribute('id', `message_${result[i].id}`);
        
        let orario = document.createElement('p');
        orario.innerHTML = ora;
        orario.setAttribute('class', 'orario');

        let stato;
        if(result[i].sent_from == myUsername)
            {
            td.setAttribute('class', 'sentByMe');

            stato = document.createElement('p');
            stato.innerHTML = "✓✓";
            if(result[i].letto == 1)
                stato.setAttribute('class', 'letto');
            else
                stato.setAttribute('class', 'nonLetto');
            }
        else
            {
            td.setAttribute('class', 'notSentByMe');

            if(result[i].letto == 0)
                ws.send(JSON.stringify({
                    type: "MESSAGE_READ",
                    id: result[i].id,
                    otherUsername: otherUsername
                }));
            }

        td.appendChild(content);
        td.appendChild(orario);

        if(stato)
            td.appendChild(stato);

        td.addEventListener('dblclick', function(){
            let message = document.getElementById(`message_${this.id}`);

            responseToMessagePar.innerHTML = message.innerHTML;
            responseToMessagePar.dataset.responseId = this.id;
            responseToMessageDiv.removeAttribute('hidden');
        });
        tr.appendChild(td);
        messagesTable.appendChild(tr);
        }
    messagesTable.scrollTop = messagesTable.scrollHeight;
    }

function fGetDataOra(orario)
    {
    let data, ora;
    
    const d = new Date(orario);
    ora = d.toTimeString().slice(0, 5);
    data = d.toISOString().split('T')[0];
    data = formatDateItalian(data);
    
    return {data, ora};
    }
function formatDateItalian(dateString)
    {
    const d = new Date(dateString);

    return d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    }


function fLoadMessages()
    {
    ws.send(JSON.stringify({
        type: "LOAD_MESSAGES",
        myUsername: myUsername,
        otherUsername: otherUsername
    }))
    }

var typingTimeout, isTyping = false;
function fSendMessage(fromBtn, key)
    {
    let messageField = document.querySelector('#message');
    let message = messageField.value.trim();

    if(!fromBtn && key != "Enter")
        {
        if(message != "" && !isTyping)
            {
            isTyping = true;
            ws.send(JSON.stringify({
                type: "IM_TYPING",
                myUsername: myUsername,
                otherUsername: otherUsername
            }));
            }

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            if(!isTyping)
                {
                isTyping = true;
                ws.send(JSON.stringify({
                    type: "IM_NOT_TYPING",
                    myUsername: myUsername,
                    otherUsername: otherUsername
                }));
                }
        }, 3000);

        if(message == "" && isTyping)
            {
            isTyping = false;
            clearTimeout(typingTimeout);
            ws.send(JSON.stringify({
                type: "IM_NOT_TYPING",
                myUsername: myUsername,
                otherUsername: otherUsername
            }));
            }
        return;
        }
    
    if(responseToMessagePar.innerHTML != "")
        {
        let id = responseToMessagePar.dataset.responseId;
        let content = responseToMessagePar.innerHTML;

        ws.send(JSON.stringify({
            type: "NEW_MESSAGE",
            message: message,
            sentFrom: myUsername,
            sentTo: otherUsername,
            responseToMessageId: id,
            responseToMessageContent: content
        }));
        fCloseResponseDiv();
        }
    else
        {
        ws.send(JSON.stringify({
            type: "NEW_MESSAGE",
            message: message,
            sentFrom: myUsername,
            sentTo: otherUsername
        }));
        }
    messageField.value = "";
    ws.send(JSON.stringify({
        type: "IM_NOT_TYPING",
        myUsername: myUsername,
        otherUsername: otherUsername
    }));
    }

async function fGetUsernames()
    {
    try 
        {
        const res = await fetch(`${API_BASE}/myChats/loadUsernames`);
        if(res.ok)
            {
            const data = await res.json();
            if(!data.myUsername || !data.otherUsername)
                throw data.error;
            myUsername = data.myUsername;
            otherUsername = data.otherUsername;
            spanMyUsername.innerHTML = myUsername;
            chatSpanUsername.innerHTML = otherUsername;
            fLoadChats();
            fLoadMessages();
            fInit();
            }
        } 
    catch(err)
        {
        console.error(err);
        }
    }

function fLoadChats()
    {
    ws.send(JSON.stringify({
        type: "GET_CHATS",
        username: myUsername,
        actualChat: otherUsername
    }));
    }
function fLoadChatsResult(success, result1, result2)
    {
    chatsTable.innerHTML = "";
    if(!success || (result1.length == 0 && result2.length == 0))
        {
        noOtherChats.removeAttribute('hidden');
        return;
        }
    noOtherChats.setAttribute('hidden', 'yes');
    if(result1)
        loadChatResult(result1);
    if(result2)
        loadChatResult(result2);
    }
function loadChatResult(result)
    {
    let DIM = result.length;
    for(let i=0;i<DIM;i++)
        {
        let tr = document.createElement('tr');
        chatsTable.appendChild(tr);
        let td = document.createElement('td');
        td.setAttribute('class', 'otherChatUsernames');
        if(result[i].username_utente2)
            td.innerHTML = result[i].username_utente2;
        else
            td.innerHTML = result[i].username_utente1;

        tr.appendChild(td);

        let tdLink = document.createElement('td');
        let a = document.createElement('a');
        if(result[i].username_utente2)
            a.setAttribute('href', `${API_BASE}/myChats/${myUsername}/${result[i].username_utente2}`);
        else
            a.setAttribute('href', `${API_BASE}/myChats/${myUsername}/${result[i].username_utente1}`);
        let tdBtn = document.createElement('button');
        tdBtn.setAttribute('name', result[i].id);
        tdBtn.innerHTML = "apri questa chat";
        a.appendChild(tdBtn);
        tdLink.appendChild(a);
        tr.appendChild(tdLink);
        }
    
    fCheckUsersOnlineAndGetNotifications();
    }

function fCheckUsersOnlineAndGetNotifications()
    {
    const users = document.getElementsByClassName('otherChatUsernames');
    const DIM = users.length;
    const usersValues = new Array(DIM);
    
    for(let i=0;i<DIM;i++)
        usersValues[i] = users[i].innerHTML;
    
    ws.send(JSON.stringify({
        type: "CHECK_USERS_STATUS",
        users: usersValues
    }));
    ws.send(JSON.stringify({
        type: "GET_NOTIFICATIONS_CHAT",
        users: usersValues,
        myUsername: myUsername
    }));
    }

function fViewUsersStatus(usersStatus)
    {
    const users = document.getElementsByClassName('otherChatUsernames');
    const DIM = usersStatus.length;

    for(let i=0;i<DIM;i++)
        {
        let existentOnlineDivs = users[i].querySelector('.onlineDivs');
        if(existentOnlineDivs)
            existentOnlineDivs.remove();
        if(usersStatus[i] == 'onlineCHAT')
            {
            let onlineDiv = document.createElement('div');
            onlineDiv.setAttribute('class', 'onlineDivs');
            users[i].appendChild(onlineDiv);
            }
        }
    }
function fViewUsersNotificationNumber(notificationsNumber)
    {
    const users = document.getElementsByClassName('otherChatUsernames');
    const DIM = notificationsNumber.length;
    

    for(let i=0;i<DIM;i++)
        {
        let existentNotificationDivs = users[i].querySelector('.nNoitificationDivs');
        if(existentNotificationDivs)
            existentNotificationDivs.remove();
        if(Number(notificationsNumber[i]) != 0)
            {
            let notificationDiv = document.createElement('div');
            notificationDiv.setAttribute('class', 'nNoitificationDivs');

            let numberDiv = document.createElement('div');
            numberDiv.setAttribute('class', 'numberNotifications');
            numberDiv.innerHTML = notificationsNumber[i];
            notificationDiv.appendChild(numberDiv);

            let p = document.createElement('p');
            p.setAttribute('class', 'parNotifications');
            if(Number(notificationsNumber[i]) == 1)
                p.innerHTML = 'nuovo messaggio';
            else
                p.innerHTML = 'nuovi messaggi';
            notificationDiv.appendChild(p);

            users[i].appendChild(notificationDiv);
            }
        }
    }

function fInit()
    {
    ws.send(JSON.stringify({
        type: "INIT",
        username: myUsername,
        from: "chat"
    }));
    }