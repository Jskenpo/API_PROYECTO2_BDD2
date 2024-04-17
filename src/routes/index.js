const { Router } = require('express');
const router = Router();

const { getAllTweets, crearTweetComplex, getTweetLikedbyUserId, getTweetPostedbyUserId, getTweetSavedbyUserId } = require('../controllers/tweet.controllers');

console.log('index.js se está cargando');

//GET 
router.get('/tweets', getAllTweets);

//GET BY ID 
router.get('/tweets/posted/:username', getTweetPostedbyUserId);
router.get('/tweets/liked/:username', getTweetLikedbyUserId);
router.get('/tweets/saved/:username', getTweetSavedbyUserId);


//POST
router.post('/tweets', crearTweetComplex);

module.exports = router;