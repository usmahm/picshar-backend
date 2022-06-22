const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    about: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    refreshToken: String,
    followers: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
    posts: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Post',
      },
    ],
    likedPosts: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);
