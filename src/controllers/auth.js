const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const path = require('path');
const User = require('../models/user');
const { getRandomCode, sendMail } = require('../utils/index');
const { throwError } = require('../utils/error');

const tokenMaxAge = 600000;
const generateNewTokens = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10s' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET);

  return [token, refreshToken];
};

exports.putSignup = async (req, res, next) => {
  try {
    const {
      email, password, username, fullName,
    } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throwError('Validation failed', 422, errors.array());
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = { code: getRandomCode(5) };
    const verificationToken = await jwt.sign(verificationCode, process.env.JWT_SECRET, { expiresIn: '300s' });

    const user = new User({
      email,
      username,
      fullName,
      password: hashedPassword,
      verificationToken,
    });

    const verificationMail = await ejs.renderFile(path.join(global.__basedir, 'public', 'mails', 'verify-mail.ejs'), { name: user.fullName.split(' ')[0], verificationCode: verificationCode.code });

    const createdUser = await user.save();
    await sendMail(
      email,
      'New User SignUp',
      'Welcome to Picshar',
      verificationMail,
    );

    res.status(201).json({ message: 'User Created', userId: createdUser._id });
  } catch (error) {
    next(error);
  }
};

exports.getSignupVerficationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throwError("A user with this email couldn't be found", 401);
    }

    const verificationCode = { code: getRandomCode(5) };
    const verificationToken = await jwt.sign(verificationCode, process.env.JWT_SECRET, { expiresIn: '300s' });
    user.verificationToken = verificationToken;

    const verificationMail = await ejs.renderFile(path.join(global.__basedir, 'public', 'mails', 'verify-mail.ejs'), { name: user.fullName.split(' ')[0], verificationCode: verificationCode.code });

    await user.save();
    await sendMail(
      email,
      'New User SignUp',
      'Welcome to Picshar',
      verificationMail,
    );

    res.status(200).json({ message: 'Verification code sent successfully' });
  } catch (error) {
    next(error);
  }
};

exports.postSignupVerificationCode = async (req, res, next) => {
  try {
    const { code, email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throwError("A user with this email couldn't be found", 401);
    }

    const decodedToken = jwt.verify(user.verificationToken, process.env.JWT_SECRET);

    if (code !== decodedToken.code) {
      throwError('Invalid verification code', 422);
    }

    user.verificationToken = undefined;
    user.emailVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }, 'email fullName password username emailVerified');

    if (!user) {
      throwError("A user with this email couldn't be found", 401);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throwError('Invalid password', 401);
    }

    const payload = {
      email: user.email,
      userid: user._id.toString(),
    };
    const [token, refreshToken] = generateNewTokens(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('token', token, {
      path: '/', secure: true, httpOnly: true, sameSite: 'Lax', maxAge: tokenMaxAge,
    });
    res.status(200).json({
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });

    if (!user) {
      throwError('Not authorized', 401);
    }

    const decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!decodedToken) {
      throwError('Not authorized', 401);
    }

    const payload = {
      email: decodedToken.email,
      userId: decodedToken.userId,
    };
    const [token, newRefreshToken] = generateNewTokens(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('token', token, {
      path: '/', secure: true, httpOnly: true, sameSite: 'Lax', maxAge: tokenMaxAge,
    });
    res.status(200).json({ message: 'Refreshed successfully', refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

exports.postLogout = async (req, res, next) => {
  try {
    const { refreshToken, userId } = req.body;
    const user = await User.findOne({ refreshToken, _id: mongoose.Types.ObjectId(userId) });

    if (!user) {
      throwError('User not logged in', 401);
    }

    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({ message: 'User logged out' });
  } catch (error) {
    next(error);
  }
};

exports.postNewPassword = async (req, res, next) => {
  try {
    const { email, newPassword, oldPassword } = req.body;

    const user = await User.findOne({ email });
    const match = await bcrypt.compare(oldPassword, user.password);

    const newMatchOld = await bcrypt.compare(newPassword, user.password);

    if (!match || newMatchOld) {
      throwError(!match ? 'Wrong old password.' : 'New password cannot be same as old password.', 403);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
