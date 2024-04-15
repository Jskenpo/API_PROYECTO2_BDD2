const { Router } = require('express');
const router = Router();

const { getAllTweets, createTweet } = require('../controllers/tweet.controllers');

//GET 
router.get('/tweets', getAllTweets);

module.exports = router;