const ws = new WebSocket(`${WS_BASE}`);
var username;
const usernameSpan = document.querySelector('#username');
const tableUtenti = document.querySelector('#utenti');
const tableChats = document.querySelector('#myChats');
const btnNotifiche = document.querySelector('#btnNotifiche');
const notifiche = document.querySelector('#notifiche');
const popupNotifiche = document.querySelector('#popupNotifiche');
const noNotifiche = document.querySelector('#noNotifiche');
const btnSegnaComeLetto = document.querySelector('#btnSegnaComeLetto');
const btnClosePopup = document.querySelector('#btnClosePopup');
const overlay = document.querySelector('#overlay');
const nNotifiche = document.querySelector('#nNotifiche');
const popupAlert = document.querySelector('#popup');
var search = document.querySelector('#search');
const logout = document.querySelector('#logout');
logout.setAttribute('href', `${API_BASE}/homepage`);

btnNotifiche.addEventListener('click', fPopupNotifications);
btnSegnaComeLetto.addEventListener('click', fRemoveNotifications)
search.addEventListener('keyup', fSearch);

ws.onopen = () => {
    fLoadUsername();
}

ws.onmessage = (msg) => {
    try
        {
        const data = JSON.parse(msg.data);
        if(!data || typeof(data.type) != 'string')
            throw new Error("Unvalid data for web socket message from client");
        switch (data.type) 
            {
            case "RESULT_GET_UTENTI":
                fLoadUtentiSearch(data.result);
                break;
            case "LOAD_CHATS_RESULT":
                fLoadChatsResult(data.success, data.result1, data.result2);
                break;
            case "ADD_NEW_CHAT_RESPONSE":
                fLoadChats(data.msg);
                break;
            case "LOAD_NOTIFICATIONS_RESULT":
                fLoadNotificationResult(data.success, data.result);
                break;
            case "RETURN_DELETE_NOTIFICATIONS":
                fLoadNotifications();
                break;
            case "LOAD_NOTIFICATIONS":
                fLoadNotifications();
                break;
            case "LOAD_CHATS":
                fLoadChats();
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

function fLoadNotifications()
    {
    ws.send(JSON.stringify({
        type: "LOAD_NOTIFICATIONS",
        username: username
    }));
    }

function fLoadNotificationResult(success, result)
    {
    notifiche.innerHTML = "";
    if(!success)
        {
        noNotifiche.removeAttribute('hidden');
        btnSegnaComeLetto.setAttribute('hidden', 'yes');
        nNotifiche.innerHTML = "";
        nNotifiche.setAttribute('hidden', 'yes');
        return;
        }
    noNotifiche.setAttribute('hidden', 'yes');
    btnSegnaComeLetto.removeAttribute('hidden');

    const DIM = result.length;
    nNotifiche.removeAttribute('hidden');
    nNotifiche.innerHTML = DIM;
    for(let i=0;i<DIM;i++)
        {
        let {data, ora} = fGetDataOra(result[i].created_at);
        let row = document.createElement('tr');
        
        let text = document.createElement('td');
        text.innerHTML = result[i].testo;
        row.appendChild(text);
        let date = document.createElement('td');
        date.innerHTML = data;
        row.appendChild(date);
        let hour = document.createElement('td');
        hour.innerHTML = ora;
        row.appendChild(hour);

        let btn = document.createElement('td');
        let btnViewNotification = document.createElement('button');
        btnViewNotification.setAttribute('id', result[i].id);
        
        let btnNotificationOpenChat;
        if(result[i].type == 'new_message')
            {
            btnViewNotification.innerHTML = "segna come letto";
            btnViewNotification.addEventListener('click', function() {
                fRemoveNotification(this.id);
                fSetMessageRead(result[i].message_id);

                let otherUsername = result[i].testo.substring(result[i].testo.lastIndexOf(" ") + 1);

                ws.send(JSON.stringify({
                    type: "MESSAGE_READ",
                    id: result[i].id,
                    otherUsername: otherUsername
                }));
            });
            }
        else
            {
            btnViewNotification.innerHTML = "ok";
            let otherUsername = result[i].testo.substring(0, result[i].testo.indexOf(' ha creato'));

            btnNotificationOpenChat = document.createElement('button');
            let a = document.createElement('a');
            let link = `${API_BASE}/myChats/${username}/${otherUsername}`;

            a.innerHTML = "vai direttamente alla chat";
            a.setAttribute('href', link);
            a.setAttribute('id', `${result[i].id}`);
            a.addEventListener('click', function(e) {
                e.preventDefault();
                fRemoveNotification(this.id);

                setTimeout(() => {
                    window.location.href = this.href;
                }, 100);
            })
            btnNotificationOpenChat.appendChild(a);
            
            btnViewNotification.addEventListener('click', function() {
                fRemoveNotification(this.id);
            });
            }

        btn.appendChild(btnViewNotification);
        row.appendChild(btn);
        if(btnNotificationOpenChat)
            row.appendChild(btnNotificationOpenChat);

        notifiche.appendChild(row);
        }
    }

function fGetDataOra(orario)
    {
    const d = new Date(orario);
    const ora = d.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const data = d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    return {data, ora};
    }

function fSetMessageRead(messageId)
    {
    if(!messageId) return;
    ws.send(JSON.stringify({
        type: "MESSAGE_READ",
        id: messageId
    }));
    }

function fRemoveNotification(id)
    {
    ws.send(JSON.stringify({
        type: "REMOVE_NOTIFICATIONS",
        username: username,
        id: id
    }));
    }

function fRemoveNotifications()
    {
    ws.send(JSON.stringify({
        type: "REMOVE_NOTIFICATIONS",
        username: username
    }));
    }

btnClosePopup.addEventListener('click', function(){
        popupNotifiche.classList.remove("open-popupNotifiche");
        overlay.style.display = 'none';
    });
function fPopupNotifications()
    {
    const isOpen = popupNotifiche.classList.contains("open-popupNotifiche");

    if (isOpen) 
        {
        popupNotifiche.classList.remove("open-popupNotifiche");
        overlay.style.display = 'none';
        }
    else
        {
        popupNotifiche.classList.add("open-popupNotifiche");
        overlay.style.display = 'block';
        }
    }

function fLoadUtentiSearch(result)
    {
    tableUtenti.innerHTML = "";
    if(!result || result.length == 0)
        {
        let tr = document.createElement('tr');
        tr.setAttribute('id', 'notFound');
        tr.innerHTML = "nessun utente trovato";
        tableUtenti.appendChild(tr);
        }
    else
        {
        const DIM = result.length;
        for(let i=0;i<DIM;i++)
            {
            let tr = document.createElement('tr');
            tableUtenti.appendChild(tr);
            let td = document.createElement('td');
            td.innerHTML = result[i].username;
            tr.appendChild(td);
            let tdBtn = document.createElement('button');
            tdBtn.setAttribute('name', result[i].username);
            tdBtn.innerHTML = "Crea una nuova chat con questo utente"
            tdBtn.addEventListener('click', () => {
                fAddNewChat(tdBtn.name);
            });
            tr.appendChild(tdBtn);
            }
        }
    }

function fAddNewChat(username2) 
    {
    ws.send(JSON.stringify({
        type: "ADD_NEW_CHAT",
        username1: username,
        username2: username2
    }));
    }

var searchTimeout;
function fSearch()
    {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        search = document.querySelector('#search').value.trim();
        if(!search || search == " " || search == "") return;
        ws.send(JSON.stringify({
            type: "GET_UTENTI",
            search: search,
            username: username
        }));
    }, 300);
    }

const btnAlert = document.getElementById('btnAlert');
btnAlert.addEventListener('click', function(){
    popupAlert.classList.remove("open-popup");
    overlay.style.display = 'none';
});
function fLoadChats(msg)
    {
    if(msg && msg == "chat alredy exist")
        {
        popup.classList.add("open-popup");
        overlay.style.display = 'block';

        return;
        }
    ws.send(JSON.stringify({
        type: "GET_CHATS",
        username: username
    }));
    }
function fLoadChatsResult(success, result1, result2)
    {
    tableChats.innerHTML = "";
    if(!success) return;
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
        tableChats.appendChild(tr);
        let td = document.createElement('td');
        if(result[i].username_utente2)
            td.innerHTML = result[i].username_utente2;
        else
            td.innerHTML = result[i].username_utente1;
        tr.appendChild(td);
        let tdLink = document.createElement('td');
        let a = document.createElement('a');
        if(result[i].username_utente2)
            a.setAttribute('href', `${API_BASE}/myChats/${username}/${result[i].username_utente2}`);
        else
            a.setAttribute('href', `${API_BASE}/myChats/${username}/${result[i].username_utente1}`);
        let tdBtn = document.createElement('button');
        tdBtn.setAttribute('name', result[i].id);
        tdBtn.innerHTML = "apri questa chat";
        a.appendChild(tdBtn);
        tdLink.appendChild(a);
        tr.appendChild(tdLink);
        }
    }

async function fLoadUsername()
    {
    try 
        {
        const res = await fetch('/chatApp/loadUsername');
        if(res.ok)
            {
            const data = await res.json();
            if(!data.username)
                throw data.error;
            username = data.username;
            usernameSpan.innerHTML = username;
            fLoadChats();
            fInit();
            fLoadNotifications();
            }
        }
    catch (err) 
        {
        console.error(err);
        }
    }

function fInit()
    {
    ws.send(JSON.stringify({
        type: "INIT",
        username: username,
        from: "homepage"
    }));
    }