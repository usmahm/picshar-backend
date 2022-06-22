global.__basedir = __dirname;
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/auth');
const profileRoute = require('./src/routes/profile');
const feedRoute = require('./src/routes/feed');

const app = express();

app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoute);
app.use('/auth', authRoutes);
app.use('/profile', profileRoute);

app.use((error, req, res, _) => {
  console.error('ERROR', error);
  const errorRes = { message: error.message };
  if (error.data) {
    errorRes.data = error.data;
  }
  res
    .status(error.statusCode || 500)
    .json(errorRes);
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const server = app.listen(8090);
    server.setTimeout(60000);
  })
  .then(() => {
    console.log('Connected');
  })
  .catch((error) => {
    console.log(error);
  });
