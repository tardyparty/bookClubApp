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

// query endpoints to show booklists
router.get('/', auth.optional, function(rq, res, next) {
    let query = {};
    let limit = 20;
    let offset = 0;

    // filer the # of booklists
    if (typeof req.query.limit !== 'undefined') {
        limit = req.query.limit;
    }

    // start counting at a later #
    if (typeof req.query.offset !== 'undefined') {
        offset = req.query.offset;
    }

    // filer by tag
    if (typeof req.query.tag !== 'undefined') {
        query.tagList = {"$in" : [req.query.tag]};
    }

    Promise.all([
        req.query.author ? User.findOne({ username: req.query.author }) : null,
        req.query.favorited ? User.findOne({ user.query.favorited}) : null
    ]).then(function(results) {
        let author = results[0];
        let favoriter = results[1];

        if (author) {
            query.author = author._id;
        }

        if (favoriter) {
            query._id = {$in: favoriter.favorites};
        } else {
            query._id = {$in: []};
        }

        return Promise.all([
            BookList.find(query)
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: 'desc' })
                .populate('author')
                .exec(),
            BookList.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null
        ]).then(function(results) {
            let booklists = results[0];
            let booklistsCount = results[1];
            let user = results[2];

            return res.json({
                booklists: booklists.map(function(booklist) {
                    return booklist.toJSONFor(user)
                }),
                booklistsCount: booklistsCount
            });
        }).catch(next);
    }).catch(next);
});

// feed of booklists based on who the user is following
router.get('/feed', auth.required, function(req, res, next) {
    var limit = 20;
    var offset = 0;
  
    if(typeof req.query.limit !== 'undefined'){
      limit = req.query.limit;
    }
  
    if(typeof req.query.offset !== 'undefined'){
      offset = req.query.offset;
    }
  
    User.findById(req.payload.id).then(function(user){
      if (!user) { return res.sendStatus(401); }
  
      Promise.all([
        BookList.find({ author: {$in: user.following}})
          .limit(Number(limit))
          .skip(Number(offset))
          .populate('author')
          .exec(),
        BookList.count({ author: {$in: user.following}})
      ]).then(function(results){
        var booklists = results[0];
        var booklistsCount = results[1];
  
        return res.json({
          booklists: booklists.map(function(article){
            return article.toJSONFor(user);
          }),
          booklistsCount: booklistsCount
        });
      }).catch(next);
    });
  });

module.exports = router;