const router = require('express').Router();
const passport = require('passport');
const mongoose = require('mongoose');
const BookList = mongoose.model('BookList');
const User = mongoose.model('User');
const auth = require('../auth');

// check auth before saving new booklist
router.post('/', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user) {
        if (!user) { return res.sendStatus(401); }

        let booklist = new BookList(req.body.booklist);

        booklist.author = user;

        return booklist.save().then(function() {
            console.log(booklist.author);
            return res.json({ booklist: booklist.toJSONFor(user)});
        });
    }).catch(next);
});

router.param('booklist', function(req, res, next, slug) {
    BookList.findOne({ slug: slug })
    .populate('author')
    .then(function(booklist) {
        if (!booklist) { return res.sendStatus(404); }

        req.booklist = booklist;

        return next();
    }).catch(next);
});

// populate booklist author before returning
router.get('/:booklist', auth.optional, function(req, res, next) {
    Promise.all([
        req.payload ? User.findById(req.payload.id) : null,
        req.booklist.populate('author').execPopulate()
    ]).then(function(results) {
        let user = results[0];

        return res.json({ booklist: req.booklist.toJSONFor(user)});
    }).catch(next);
});

// endpoints to update booklists
router.put('/:booklist', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user) {
        if (req.booklist.author._id.toString() === req.payload.id.toString()) {
            if (typeof req.body.booklist.title !== 'undefined') {
                req.booklist.title = req.body.booklist.title;
            }

            if (typeof req.body.booklist.description !== 'undefined') {
                require.booklist.description = req.body.booklist.description;
            }

            if (typeof req.body.booklist.body !== 'undefined') {
                req.booklist.body = req.body.booklist.body;
            }

            req.booklist.save().then(function(booklist) {
                return res.json({ booklist: booklist.toJSONFor(user)});
            }).catch(next);
        } else {
            return res.sendStatus(403);
        }
    });
});

// deleting articles 
router.delete('./:booklist', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function() {
        if (req.booklist.author._id.toString(0) === req.payload.id.toString()) {
            return req.booklist.remove().then(function() {
                return res.sendStatus(204);
            });
        } else {
            return res.sendStatus(403);
        }
    });
});

// endpoints for favoriting
router.post('/:booklist/favorite', auth.required, function(req, res, next) {
    let booklistId = req.booklist._id;

    User.findById(req.payload.id).then(function(user) {
        if (!user) { return res.sendStatus(401); }

        return user.favorite(booklistId).then(function() {
            return req.booklist.updateFavoriteCount().then(function(booklist) {
                return res.json({ booklist: booklist.toJSONFor(user)});
            });
        });
    }).catch(next);
});

// endpint to unfavorite 
router.delete('/:booklist/favorite', auth.required, function(req, res, next) {
    let booklistId = req.booklist._id;

    User.findById(req.payload.id).then(function(user) {
        if (!user) { return res.sendStatus(401); }

        return user.unfavorite(booklistId).then(function() {
            return req.booklist.updateFavoriteCount().then(function(booklist) {
                return res.json({ booklist: booklist.toJSONFor(user)});
            });
        });
    }).catch(next);
});

// create new comment on booklist
router.post('/:booklist/comments', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user) {
        if (!user) { return res.sendStatus(401); }

        let comment = new Comment(req.body.comment);
        comment.booklist = req.booklist;
        comment.author = user;

        return comment.save().then(function() {
            req.booklist.comments.push(comment);

            return req.booklist.save().then(function(booklist) {
                res.json({ comment: comment.toJSONFor(user)});
            });
        });
    }).catch(next);
});

// retrieve all comments for booklist
router.get('/:booklist/comments', auth.optional, function(req, res, next) {
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user) {
        return req.booklist.populate({
            path: 'comments',
            populate: {
                path: 'author',
            },
            options: {
                sort: {
                    createdAt: 'desc'
                }
            }
        }).execPopulate().then(function(booklist) {
            return res.json({ comments: req.booklist.comments.map(function(comment) {
                return comment.toJSONFor(user);
            })});
        });
    }).catch(next);
});

router.param('comment', function(req, res, next, id) {
    Comment.findById(id).then(function(comment) {
        if (!comment) { return res.sendStatus(404); } 

        req.comment = comment;

        return next();
    }).catch(next);
});

// user can delete comment
router.delete('/:booklist/comments/:comment', auth.required, function(req, res, next) {
    if (req.comment.author.toString() === req.payload.id.toString()) {
        req.booklist.comments.remove(rew.comment._id);
        req.booklist.save()
        .then(Comment.find({_id: req.comment._id}).remove().exec())
        .then(function() {
            res.sendStatus(204);
        });
    } else {
        res.sendStatus(403);
    }
});

module.exports = router;