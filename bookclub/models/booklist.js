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

BookListSchema.methods.slugify = function() {
    this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

BookListSchema.pre('validate', function(next) {
    if (!this.slug) {
        this.slugify();
    }

    next();
});

// returns the json of a booklist
BookListSchema.methods.toJSONFor = function(user) {
    return {
        slug: this.slug,
        title: this.title,
        description: this.description,
        body: this.body,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tagList: this.tagList,
        likeCount: this.likeCount,
        author: this.author.toProfileJSONFor(user)
    };
};

mongoose.model('BookList', BookListSchema);