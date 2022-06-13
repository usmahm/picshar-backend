require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const profileRoute = require('./src/routes/profile');
const feedRoute = require('./src/routes/feed');

const app = express();

app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use((req, res, next) => {
  console.log('LOGGER', req.url);
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
  .then(() => app.listen(8080))
  .then(() => {
    console.log('Connected');
  })
  .catch((error) => {
    console.log(error);
  });
