const express = require('express');

const router = express.Router();

router.get('/');

router.get('/:id');

router.post('/reaction/:type');

module.exports = router;
