const router = require('express').Router();
const mongoose = require('mongoose');
const BookList = mongoose.model('BookList');

router.get('/', function(req, res, next) {
    BookList.find().distinct('tagList').then(function(tags) {
        return res.json({ tags: tags });
    }).catch(next);
});

module.exports = router;