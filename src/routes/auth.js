const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/login', authController.login);

router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail()
      .custom(async (value) => {
        try {
          const user = await User.findOne({ email: value });
          if (user) {
            throw new Error('Email already used.');
          }
        } catch (error) {
          console.log(error);
          throw error;
        }
      }),
    body('fullName')
      .trim(),
    body('password')
      .trim()
      .isLength({ min: 6 })
      .withMessage('Password must be 6 character long')
      .isLength({ max: 72 })
      .withMessage('Password is too long'),
    // .not()
    // .isIn(['password', '12345', '111111', '1234567890'])
    // .withMessage("You're not allowed to use common words"),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 character'),
  ],
  authController.signup,
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

router.post('/reset-password');

module.exports = router;
