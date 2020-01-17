const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');

let BookListSchema = new mongoose.Schema({
    slug: {
        type: String,
        lowercase: true,
        unique: true
    },
    title: String,
    description: String,
    body: String,
    likeCount: {
        type: Number,
        default: 0
    },
    tagList, [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

BooklistSchema.plugin(uniqueValidator, { message: "is already taken."});

mongoose.model('BookList', BookListSchema);