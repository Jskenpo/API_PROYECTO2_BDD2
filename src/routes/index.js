const { Router } = require('express');
const router = Router();

const { getAllTweets, crearTweetComplex, getTweetLikedbyUserId, getTweetPostedbyUserId, getTweetSavedbyUserId, createRT, getTweetbyId } = require('../controllers/tweet.controllers');
const { createUser, verifyUser } = require('../controllers/user.controllers');

console.log('index.js se está cargando');

//GET 
router.get('/tweets', getAllTweets);

//GET BY ID 
router.get('/tweets/posted/:username', getTweetPostedbyUserId);
router.get('/tweets/liked/:username', getTweetLikedbyUserId);
router.get('/tweets/saved/:username', getTweetSavedbyUserId);


//POST
router.post('/tweets', crearTweetComplex);
router.post('/users', createUser);
router.post('/users/verify', verifyUser);
router.post('/tweets/rt', createRT);

//GET BY ID
router.post('/tweets/single', getTweetbyId);

module.exports = router;