'use strict';
// using https://blog.nodeswat.com/implement-access-control-in-node-js-8567e7b484d1
// As of righ now it runs, however, functunality not tested
// To do:
// 	- need to test 
//  - need to modify for our needs

let express = require('express');
let session = require('express-session');
let eSession = require('easy-session');
let cookieParser = require('cookie-parser');

let app = express();

app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(eSession.main(session));

//function to retrieve stored role logic in the database layer
app.use(eSession.main(session, {
    rbac: {
        guest: {
            can: ['blog:read']
        },
        writer: {
            can: ['blog:create', {
                name: 'blog:edit',
                when: function (params, cb) {
                    //check if user is the owner
                    setImmediate(cb, null, params.user.id === params.blog.ownerId);
                }
            }],
            inherits: ['guest']
        }
    }
}));



// Add a path to allow easy login to any role
app.get('/login/:role', function (req, res, next) {
    // Going to hardcode the user object
    let extend = {
        user: {
            id: 2
        }
    };
    req.session.login(req.params.role, extend, function () {
        res.redirect('/');
    });
});

//checks for the right to create a blog post
app.get('/blog/create', eSession.can('blog:create'), function (req, res, next) {
    res.send('Blog edit');
});


function getParams(req, res, cb) {
    findBlog(req.params.id)
        .then(function (blog) {
            cb(null, {
                user: req.session.user,
                blog: blog
            });
        }, cb);
}
//edit a post and check if you can edit
app.get('/blog/edit/:id', eSession.can('blog:edit', getParams), function (req, res, next) {
    res.send('Editing blog');
});

// A path to destroy our session
app.get('/logout', function (req, res, next) {
    req.session.logout(function () {
        res.redirect('/');
    });
});

app.get('/', function (req, res, next){
    res.send('Current role is ' + req.session.getRole());
});

app.listen(3000);