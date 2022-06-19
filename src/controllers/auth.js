const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const tokenMaxAge = 600000;
const generateNewTokens = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10s' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET);

  return [token, refreshToken];
};

exports.signup = async (req, res, next) => {
  try {
    const {
      email, password, username, fullName,
    } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      username,
      fullName,
      password: hashedPassword,
    });

    const createdUser = await user.save();

    res.status(201).json({ message: 'User Created', userId: createdUser._id });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  // console.log(req.body.email)
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }, 'email fullName password username emailVerified');
    // console.log(user);
    if (!user) {
      const error = new Error("A user with this email couldn't be found");
      error.statusCode = 401;
      throw error;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const error = new Error('Invalid password');
      error.statusCode = 401;
      throw error;
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

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });

    if (!user) {
      const error = new Error('Not authorized');
      error.statusCode = 401;
      throw error;
    }

    const decodedToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    // console.log('\nDECODED\n', decodedToken);
    if (!decodedToken) {
      const error = new Error('Not authorized');
      error.statusCode = 401;
      throw error;
    }

    const payload = {
      email: decodedToken.email,
      userId: decodedToken.userId,
    };
    // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10s' });
    // const refr = jwt.sign(payload, process.env.JWT_REFRESH_SECRET);
    const [token, newRefreshToken] = generateNewTokens(payload);

    console.log('\n----------------\n');
    console.log(newRefreshToken, '\n', refreshToken);
    console.log('\n----------------\n');

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

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken, userId } = req.body;
    const user = await User.findOne({ refreshToken, _id: mongoose.Types.ObjectId(userId) });

    if (!user) {
      const error = new Error('User not logged in');
      error.statusCode = 401;
      throw error;
    }

    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({ message: 'User logged out' });
  } catch (error) {
    next(error);
  }
};
