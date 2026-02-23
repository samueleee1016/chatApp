const ws = new WebSocket(`${WS_BASE}`);
const btn = document.querySelector('#btn');
const errorChar = document.querySelector('#errorChar');
const errorUsername = document.querySelector('#errorUsername');
const errorCharPsw = document.querySelector('#errorCharPsw');
const errorNumber = document.querySelector('#errorNumber');
const form = document.querySelector('#dataForm');
let username = document.querySelector('#username');
let psw = document.querySelector('#psw');
username.addEventListener('keyup', fCheckForm);
psw.addEventListener('keyup', fCheckForm);
var checkUsername = false;

form.setAttribute('action', `${API_BASE}/checkRegistration`);

ws.onmessage = async (msg) => {
    try
        {
        const data = JSON.parse(msg.data);
        if(!data || typeof(data.type) != 'string')
            throw new Error("Unvalid data for web socket message from client");
        switch (data.type) {
            case "RETURN_CHECK_USERNAME":
                fReturnUsernameCheck(data.result);
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

var usernameCheckTimeout;
function fCheckForm()
    {
    username = document.querySelector('#username').value.trim();
    psw = document.querySelector('#psw').value.trim();
    
    let checkChars = fCheckCharsUsername(username);

    clearTimeout(usernameCheckTimeout);
    usernameCheckTimeout = setTimeout(() => {
        fCheckIfUsernameExist(username)
    }, 300);

    if(!username || username.length < 3 || username.length > 30 || !checkChars || !checkUsername)
        {
        btn.disabled = true;
        return;
        }
    let checkPswChars = fCheckPswChars(psw);
    let checkNumbers = fCheckNumbersUsername(psw);
    if(!psw || psw.length > 64 || !checkPswChars || !checkNumbers)
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

function fCheckNumbersUsername(username)
    {
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'o'];
    const DIM = numbers.length;
    let cont = 0;
    var i=0;

    for(i;i<DIM;i++)
        {
        if(!username.includes(numbers[i]))
            cont++;
        }
    
    if(cont == i)
        {
        errorNumber.removeAttribute('hidden');
        return false;
        }
    errorNumber.setAttribute('hidden', 'yes');
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

function fCheckIfUsernameExist(username)
    {
    ws.send(JSON.stringify({type: "CHECK_USERNAME", username: username}));
    }
function fReturnUsernameCheck(result)
    {
    switch (result) {
        case "username_ok":
            checkUsername = true;
            errorUsername.setAttribute('hidden', 'yes');
            fCheckForm();
            break;
        case "username_alredy_exist":
            checkUsername = false;
            errorUsername.removeAttribute('hidden');
            fCheckForm();
            break;
        default:
            break;
    }
    }