const { Router } = require('express');
const router = Router();

const { getAllTweets, crearTweetComplex } = require('../controllers/tweet.controllers');

//GET 
router.get('/tweets', getAllTweets);


//POST
router.post('/tweets', crearTweetComplex);

module.exports = router;