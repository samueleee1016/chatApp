const service = require('../services/service');
const HttpError = require('../errors/httpError');

exports.controllerRegistration = async (req, res) => {
    const result = await service.registrationService(req.loginData);
    return res.status(200).redirect('/chatApp/homepage');
};

exports.controllerLogin = async (req, res) => {
    req.session.username = req.body.username;
    return res.status(200).redirect('/chatApp/homepageUtente.html');
};

exports.loadUsername = (req, res) => {
    if(req.session.username)
        res.json({username: req.session.username});
    else
        {
        const error = new HttpError("utente non loggato");
        res.status(401).json({error: error});
        }
}

exports.loadMyChat = (req, res) => {
    const {myUsername} = req.params;
    const {otherUsername} = req.params;

    req.session.myUsername = myUsername;
    req.session.otherUsername = otherUsername;
    res.status(200).redirect('/chatApp/myChat');
}

exports.loadMyChatUsernames = (req, res) => {
    if(req.session.myUsername && req.session.otherUsername)
        res.json({myUsername: req.session.myUsername, otherUsername: req.session.otherUsername});
    else
        {
        const error = new HttpError("errore utenti chat");
        res.status(401).json({error: error});
        }
}
