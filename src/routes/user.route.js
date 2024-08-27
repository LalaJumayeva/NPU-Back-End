const express = require('express');
const multer = require('multer');
const { getProfile, editProfile } = require('../controllers/user.controller');
const jwtAuthMiddleware = require('../middlewares/auth.js');



const router = express.Router();
const upload = multer();

router.use(jwtAuthMiddleware)

router.get('/me', getProfile);
router.patch('/me', upload.single('avatar'), editProfile);

module.exports = router
