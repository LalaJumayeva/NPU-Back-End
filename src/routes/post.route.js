const express = require('express');
const multer = require('multer');
const upload = multer();


const router = express.Router();

const { getPosts, createPost, getPostbyID, updatePost, deletePost, likePost, dislikePost, getOwnPosts } = require('../controllers/post.controller');
const jwtAuthMiddleware = require('../middlewares/auth.js');


router.get('/', getPosts);
router.get('/:id', getPostbyID);

router.use(jwtAuthMiddleware);

router.post('/',  upload.array('images', 2),createPost);
router.get('/me', getOwnPosts);

router.patch('/:id', updatePost);
router.delete('/:id', deletePost);

router.post('/:id/like', likePost);
router.post('/:id/dislike', dislikePost);

module.exports = router
