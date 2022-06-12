const express = require('express');

const router = express.Router();

router.post('/login');
router.put('/signup', (req, res, next) => {
  console.log('Recieved', req.body);
  res.status(201).json('POSTED');
});
router.post('/reset-password');

module.exports = router;
