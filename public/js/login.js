const ws = new WebSocket(`${WS_BASE}`);
const container = document.querySelector('#container');
const btn = document.querySelector('#btn');
const errorChar = document.querySelector('#errorChar');
const errorCharPsw = document.querySelector('#errorCharPsw');
const unvalidData = document.querySelector('#unvalidData');
const validData = document.querySelector('#validData');
const rateLimitedDiv = document.querySelector('#rateLimited');
const form = document.querySelector('#dataForm');
let username = document.querySelector('#username');
let psw = document.querySelector('#psw');
username.addEventListener('keyup', fCheckForm);
psw.addEventListener('keyup', fCheckForm);
var dataChecked = false;

form.setAttribute('action', `${API_BASE}/checkLogin`);

ws.onmessage = async (msg) => {
    try
        {
        const data = JSON.parse(msg.data);
        if(!data || typeof(data.type) != 'string')
            throw new Error("Unvalid data for web socket message from client");
        switch (data.type) {
            case "RESULT_VERIFY_ACCESS":
                fResultValidateAccess(data.success, data.rateLimit);
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

function fCheckForm()
    {
    username = document.querySelector('#username').value.trim();
    psw = document.querySelector('#psw').value.trim();
    
    let checkChars = fCheckCharsUsername(username);
    if(!username || username.length < 3 || username.length > 30 || !checkChars)
        {
        btn.disabled = true;
        return;
        }
    let checkPswChars = fCheckPswChars(psw);
    if(!psw || psw.length > 64 || !checkPswChars)
        {
        btn.disabled = true;
        return;
        }
    
    btn.disabled = false;
    return;
    }

function fCheckCharsUsername(username)
    {
    const chars = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];
    const charsUpper = chars.map(c => c.toUpperCase());
    const DIM = chars.length;
    let cont = 0;
    var i=0;

    for(i;i<DIM;i++)
        {
        if(!username.includes(chars[i]) && !username.includes(charsUpper[i]))
            cont++;
        }
    
    if(cont == i)
        {
        errorChar.removeAttribute('hidden');
        return false;
        }
    errorChar.setAttribute('hidden', 'yes');
    return true;
    }

function fCheckPswChars(psw)
    {
    const forbiddenChars = [' ', '"', "'", '`', '<', '>', ';', ','];
    const DIM = forbiddenChars.length;
    let cont = 0;
    var i=0;

    for(i;i<DIM;i++)
        {
        if(!psw.includes(forbiddenChars[i]))
            cont++;
        }
    
    if(cont != i || psw.length < 6)
        {
        errorCharPsw.removeAttribute('hidden');
        return false;
        }
    errorCharPsw.setAttribute('hidden', 'yes');
    return true;
    }

function fValidateDatas(e)
    {
    if(!dataChecked)
        {
        btn.disabled = true;
        e.preventDefault();
        username = document.querySelector('#username').value.trim();
        psw = document.querySelector('#psw').value.trim();

        ws.send(JSON.stringify({
            type: "VALIDATE_ACCESS",
            username: username,
            psw: psw
        }));
        }
    }

function fResultValidateAccess(success, rateLimit)
    {
    btn.disabled = false;
    if(!success && rateLimit)
        {
        container.setAttribute('hidden', 'yes');

        let minutiRimasti = document.querySelector('#minutiRimasti');
        minutiRimasti.innerHTML = rateLimit.minutiRimasti;

        rateLimitedDiv.removeAttribute('hidden');
        }
    else if(!success)
        {
        unvalidData.removeAttribute('hidden');
        return;
        }
    
    let username = document.querySelector('#username');
    let psw = document.querySelector('#psw');
    username.setAttribute('readonly', 'yes'); 
    psw.setAttribute('readonly', 'yes');
    dataChecked = true;
    unvalidData.setAttribute('hidden', 'yes');
    validData.removeAttribute('hidden');
    btn.innerHTML = "Accedi"
    }