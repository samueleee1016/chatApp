const HttpError = require('../errors/httpError');
const checkCharsFuncions = require('./checkRegistrationDataChars');

exports.checkRegistration = async (req, res, next) => {
    if(!req.body)
        throw new HttpError("body data must exist", 400);
    const username = req.body.username.trim();
    const psw = req.body.psw.trim();

    if(!username || username.length < 3 || username.length > 30 || !checkCharsFuncions.username(username))
        throw new HttpError("unvalid username", 400);
    if(!psw || psw.length < 6 || psw.length > 64 || !checkCharsFuncions.password(psw))
        throw new HttpError("unvalid password", 400);

    req.loginData = {username, psw};
    next();
};