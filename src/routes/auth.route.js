const express = require('express');
const multer = require('multer');
const { register, login } = require('../controllers/auth.controller');
const router = express.Router();
const upload = multer();

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);

module.exports = router
