require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();
const postRoute = require('./src/routes/post.route')
const authRoute = require('./src/routes/auth.route')
const categoryRoute = require('./src/routes/category.route')
const userRoute = require('./src/routes/user.route')
const searchRoute = require('./src/routes/search.route')


AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1',
});

const s3 = new AWS.S3();

app.use(express.json());

app.use(cors());

//using form
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
  req.s3 = s3;
  next();
});

app.use('/api/post', postRoute);
app.use('/api/auth', authRoute)
app.use('/api/category', categoryRoute)
app.use('/api/profile', userRoute)
app.use('/api/search', searchRoute)

mongoose.connect(process.env.MONGODB_URI)
  .then(() =>
   {
    console.log('Connected to Database!')
    app.listen(process.env.PORT, () =>{ console.log('Server started at port ' + process.env.PORT)});
   }
);
