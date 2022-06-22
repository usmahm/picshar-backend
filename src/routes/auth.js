const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/verify-email', authController.getSignupVerficationCode);

router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),
    body('fullName')
      .trim(),
    body('password')
      .trim()
      .isLength({ min: 6 })
      .withMessage('Password must be 6 character long')
      .isLength({ max: 72 })
      .withMessage('Password is too long')
      .not()
      .isIn(['password', '12345', '111111', '1234567890'])
      .withMessage("You're not allowed to use common words")
      .custom((value, { req }) => {
        if (value !== req.body.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 character'),
    body()
      .custom(async (value) => {
        try {
          const user = await User.findOne({
            $or: [
              { email: value.email }, { username: value.username },
            ],
          });
          if (user) {
            throw new Error(`${user.email === value.email ? ' Email' : 'Username'} already used.`);
          }
        } catch (error) {
          throw error;
        }
      }),
  ],
  authController.putSignup,
);

router.post('/login', authController.postLogin);
router.post('/refresh', authController.getRefreshToken);
router.post('/logout', authController.postLogout);
router.post('/verify-email', authController.postSignupVerificationCode);

router.post(
  '/change-password',
  body('newPassword')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be 6 character long')
    .isLength({ max: 72 })
    .withMessage('Password is too long')
    .custom((value, { req }) => {
      if (value !== req.body.confirmNewPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    }),
  authController.postNewPassword,
);

router.post('/forgot-password');

module.exports = router;
