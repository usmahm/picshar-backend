const mongoose = require('mongoose');

const { Schema } = mongoose;

const postSchema = new Schema(
  {
    caption: String,
    likes: {
      type: Number,
      default: 0,
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    hashtags: [
      {
        type: String,
      },
    ],
    comments: [
      new Schema(
        {
          comment: {
            type: String,
            required: true,
          },
          creator: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
          },
        },
        {
          timestamps: true,
        },
      ),
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Post', postSchema);
