exports.username = (username) => {
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
        return false;
    return true;
}

exports.password = (psw) => {
    const forbiddenChars = [' ', '"', "'", '`', '<', '>', ';', ','];
    const DIM = forbiddenChars.length;
    let cont = 0;
    var i=0;

    for(i;i<DIM;i++)
        {
        if(!psw.includes(forbiddenChars[i]))
            cont++;
        }
    
    if(cont != i)
        return false;
    return true;
}