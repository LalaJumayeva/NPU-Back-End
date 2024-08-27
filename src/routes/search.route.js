const express = require('express');
const { searchPosts } = require('../controllers/search.controller');
const router = express.Router();

router.get('/', searchPosts);
module.exports = router
