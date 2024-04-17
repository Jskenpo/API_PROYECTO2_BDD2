const { Router } = require('express');
const router = Router();

const { getAllTweets, crearTweetComplex, getTweetLikedbyUserId, getTweetPostedbyUserId, getTweetSavedbyUserId, createRT, getTweetbyId, createReply, getRepliesbyId, getLikesbyTweet, searchTweetbyText, deleteTweet, editarTweet } = require('../controllers/tweet.controllers');
const { createUser, verifyUser, updateUsername, userLikesTweet, userSavesTweet, deleteUserComplex } = require('../controllers/user.controllers');

console.log('index.js se está cargando');

//READ 
router.get('/tweets', getAllTweets);

//READ BY ID 
router.get('/tweets/posted/:username', getTweetPostedbyUserId);
router.get('/tweets/liked/:username', getTweetLikedbyUserId);
router.get('/tweets/saved/:username', getTweetSavedbyUserId);
router.post('/tweets/replies', getRepliesbyId);
router.post('/tweets/likes', getLikesbyTweet);
router.post('/users/verify', verifyUser);
router.post('/tweets/search', searchTweetbyText);


//CREATE
router.post('/tweets', crearTweetComplex);
router.post('/users', createUser);
router.post('/tweets/rt', createRT);
router.post('/tweets/reply', createReply);
router.post('/users/like', userLikesTweet);
router.post('/users/save', userSavesTweet);

//UPDATE
router.post('/users/updateUsername', updateUsername);
router.post('/tweets/edit', editarTweet);

//DELETE
router.post('/tweets/delete', deleteTweet);
router.post('/users/delete', deleteUserComplex);

//GET BY ID
router.post('/tweets/single', getTweetbyId);

module.exports = router;