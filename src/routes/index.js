const { Router } = require('express');
const router = Router();

const { getAllTweets, crearTweetComplex, getTweetLikedbyUserId, getTweetPostedbyUserId } = require('../controllers/tweet.controllers');

//GET 
router.get('/tweets', getAllTweets);

//GET BY ID 
router.get('/tweets/posted/:username', getTweetPostedbyUserId);
router.get('/tweets/liked/:username', getTweetLikedbyUserId);


//POST
router.post('/tweets', crearTweetComplex);

module.exports = router;