const express = require('express');
const path = require('path');
const router = express.Router();
const controller = require('../controllers/controller');
const checkRegistration = require('../middlewares/checkRegistration.middleware').checkRegistration;
const {registerLimiter, deleteLimiter} = require('../middlewares/rateLimiter.function');

router.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/homepage.html'));
})
router.get('/homepageUtente', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/homepageUtente.html'));
})

router.get('/myChat', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/myChat.html'));
})

router.post('/checkRegistration', checkRegistration, registerLimiter, controller.controllerRegistration);

router.post('/checkLogin', controller.controllerLogin);

router.get('/loadUsername', controller.loadUsername);

router.get('/myChats/:myUsername/:otherUsername', controller.loadMyChat);

router.get('/myChats/loadUsernames', controller.loadMyChatUsernames);

router.delete('/deleteAccount/:username', deleteLimiter, controller.deleteAccount);


router.all(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/getAll.html'));
});

module.exports = router;