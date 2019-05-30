// ===== dependancies =====

const express           = require('express');
const bodyParser        = require("body-parser");
const AccessControl     = require('accesscontrol');
const sqlite3           = require("sqlite3").verbose();  // use sqlite
const fs                = require("fs");
const users             = require('./users');
const passport          = require('passport');
const LocalStrategy     = require('passport-local').Strategy; //passport local strategy
const session           = require('express-session');//({ secret: 'mango', resave: false, saveUninitialized: false });
const path              = require('path');
const port              = 8080;
const app               = express();

// ===== setup database =====

const dbFileName = "mango.db";

const SqlString = require("sqlstring");

const db = new sqlite3.Database(dbFileName, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        // console.log('Created/connected to the database.');
        console.log("Setting up database");
        
        // categories: category_id, title, public
        db.run("CREATE TABLE IF NOT EXISTS categories(category_id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, public INTEGER)", creationerror(err)); 
        // posts: category_id, post_id, user_id, date_created, title, content
        db.run("CREATE TABLE IF NOT EXISTS posts(category_id INTEGER, post_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date_created DATETIME, title TEXT, content TEXT)", creationerror(err)); 
        // replies: category_id, post_id, reply_id, user_id, date_created, content
        db.run("CREATE TABLE IF NOT EXISTS replies(category_id INTEGER, post_id INTEGER, reply_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date_created DATETIME, content TEXT)", creationerror(err)); 
        // roles: category_id, user_id, role
        db.run("CREATE TABLE IF NOT EXISTS roles(category_id INTEGER, user_id INTEGER, role INTEGER)"); 

        // users: id, user_id, password, role
        db.run("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,"
            + "username VARCHAR(45) UNIQUE, password VARCHAR(45), role INTEGER)", creationerror(err));
    }
});

function creationerror(err) {
    if(err) {
        console.log(err);
    }
}

// ========== PASSPORT (Authentication) CODE ==================================

app.use(session({ secret: 'mango', cookie: {secure: false, maxAge: 6 * 60 * 60 * 1000}, resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function(username, password, done) {
        // find username from db
        users.find_user(username, db, function(err,user) {
            if(err) { done(err); }
            if(!user) {
                // return done(null, false, { message: 'Incorrect username.' });
                console.log("wrong user");
                return done(null, false);
            }

            // match password
            if(!users.valid_password(username, password,db)) {
                // return done(null, false, { message: 'Incorrect password.' });
                console.log("wrong pass");
                return done(null, false);
            }
            // console.log("localstrategy", user);
            return done(null, user);
        });
    })
);

passport.serializeUser(function(user, cb) {
    // console.log("serializing", user);
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    // console.log("deserializing", id);
    users.find_userid(id, db, function(err, user) {
        if(err) { return cb(err); }
        cb(null, user);
    });
});

// ============================================================================

//DEFINING THE ACCESS CONTROL BASIC STRUCTURE, WITHOUT PRIVATE


//the list of orders could be defined inside a data base as an array, and we can only read it in
// can be found on the last example https://www.npmjs.com/package/accesscontrol#expressjs-example
const ac = new AccessControl();
ac.grant('user')                
        .createOwn('post') // explicitly defined attributes
        .updateOwn('post')
        .deleteOwn('post')
        .createOwn('reply')
        .updateOwn('reply')
        .deleteOwn('reply')
        .createOwn('category')
    .grant('moderator')
        //ONLY ONE MODERATOR PER CATEGORY!
        .extend('user')
        .deleteAny('post')
        .deleteOwn('category')
        .updateOwn('category') 
        .deleteAny('reply')
    .grant('admin')
        .extend('moderator')
        .deleteAny('category'); 
        

function getSingleRole(userid, categoryid, cb) {
    let sqlquery = "SELECT * FROM roles WHERE user_id=" + userid+" AND category_id="+categoryid;
    db.all(sqlquery, function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}

function getSingleCategory(categoryid, cb) {
    let sqlquery = "SELECT * FROM categories WHERE category_id=" + categoryid;
    db.all(sqlquery, function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}

function getSinglePost(categoryid, post_id, user_id, cb) {
    let sqlquery = "SELECT * FROM posts WHERE category_id=" + categoryid + " AND post_id=" + post_id + " AND user_id=" + user_id;
    db.all(sqlquery, function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}

/*
getSinglePost(4, 3, 2, function(posts_err, posts_row) {
    if(posts_err)
        console.log("Error! Can't find posts!");
    else
    {
        console.log(posts_row);
    }
});
*/

function getSingleReply(categoryid, post_id, user_id, reply_id, cb) {
    let sqlquery = "SELECT * FROM replies WHERE category_id=" + categoryid + " AND post_id=" + post_id + " AND user_id=" + user_id + " AND reply_id=" + reply_id;
    db.all(sqlquery, function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}

/*
getSingleReply(4, 3, 2, 6, function(replies_err, replies_row) {
    if(replies_err)
        console.log("Error! Can't find replies!");
    else
    {
        console.log(replies_row);
    }
});
*/

function checkOwnership(category_id, post_id, user_id, reply_id, cb)
{
    if(reply_id === -1)
    {
        getSinglePost(category_id, post_id, user_id, function(posts_err, posts_row) {
            if(posts_err)
                console.log("Error! Can't find posts!");
            else
            {
                console.log(posts_row);
                if(posts_row == null)
                    cb(false);
                else
                    cb(true);
            }
        });
    }
    else
    {
        getSingleReply(category_id, post_id, user_id, reply_id, function(replies_err, replies_row) {
            if(replies_err)
                console.log("Error! Can't find replies!");
            else
            {
                //console.log(replies_row);
                if(replies_row == null)
                    cb(false);
                else
                    cb(true);
            }
        });
    }
}
//4,3,2,-1, should return true
// checkOwnership(4, 3, 2, 6, function(condition) {
//     console.log(condition);
// });





function checkAccess(user_id, category_id, operation, element)
{
    users.find_userid(user_id, db, function(users_err, users_row) {
        if(users_err)
            console.log("Error! Can't find users!");
        else 
        {
            getSingleRole(user_id, category_id, function(roles_err, roles_row) {
                if(roles_err)
                    console.log("Error! Can't find roles!");
                else
                {
                    getSingleCategory(category_id, function(categories_err, categories_row) {
                        let user_role = 'none';
                        let category_type = -1; // public for now
                        if(categories_err)
                            console.log("Error! Can't find categories!");
                        else
                        {
                            checkOwnership(4, 3, 7, 6, function(condition) {
                                //console.log(condition);
                            
                                //console.log(users_row);
                                //console.log(roles_row);
                                //console.log(categories_row);
                                if(users_row == null)
                                    user_role = 'guest';
                                else if(users_row.role == 1)
                                    user_role = 'admin';
                                else if(roles_row == null)
                                    user_role = 'user';
                                else if (roles_row.role == 1)
                                    user_role = 'member';
                                else if (roles_row.role == 2)
                                    user_role = 'moderator';
                                if(categories_row == null)
                                    console.log("category doesn't exist");
                                else
                                    category_type = categories_row.public;

                                if((operation === 'update' || operation === 'delete') && (element === 'post' || element === 'reply'))
                                {
                                    if(!condition)
                                        console.log("condition",condition)
                                    //if inside here, return false, aka make cb false
                                } // when execution goes beyond this if statement
                                let accessGranted = hasAccess(operation, element, user_role, category_type);
                                console.log("access" ,accessGranted);

                                //if operation is update and element is post or reply
                                //  check ownership, if none return false

                                //if operation is delete and element is post or reply 
                                // check ownership, if none return false
                                

                                //cb();
                            });
                        }
                    });
                }
            });
        }
    });
}
checkAccess(2,5,'update','reply');



//usr id (GLOBAL), userInfo(db), categoryInfo(db), 
//FINAL USER ROLES: guest, user, moderator, admin
function hasAccess(operation, element, user_role, type)
{
    //need to get user role!!! (ONLY ONCE)
    //inside user role, if user is not listed inside categories data
    // base he is treated like a guest to the category!!!! 
    //findRole, checks the users role in the category
    let category_type = type

    if(operation === 'read')
    {
        if (category_type === 1) //if public
            return true;
        else if(category_type === 0)// if private
        {
            if(user_role === 'guest' || user_role === 'user') 
                return false;
            else // if member, moderator or admin
                return true;
        }
    }
    else if(operation === 'create')
    {
        if (user_role === 'guest')
            return false;
        if (element === 'category')
        {
            //category doesn't exist, so 'member' hold not be possible
            if(user_role === 'member')
                user_role = 'user'
            const permission = ac.can(user_role).createOwn('category');
            // need to update data base in createNewCateory()
            return permission.granted;
        }
        else // element is either post or reply
        {
            if (category_type === 1)
                return true; //user,member,moderator and admin can create posts,replies
            else if(category_type === 0)// if private
            {
                if(user_role === 'user') 
                    return false;
                else // member, moderator, admin (all can create posts and replies)
                {
                    return true;
                }
            }
        }
    }
    //updates can only be made by the person owning the element
    else if(operation === 'update')
    {
        if(user_role === 'guest')
            return false;
        if(element === 'category')
        { 
            if(user_role === 'member')
                user_role = 'user';
            //findRole, checks the users role in the category
            const permission = (user_role === 'moderator')
                   ? ac.can(user_role).updateOwn('category') // if moderator then update own
                   : ac.can(user_role).updateAny('category'); // if not moderator check if admin
            //NEED TO UPDATE USER TO MODERATOR on categ. creation
            return permission.granted;
        }
        else // element is either post or reply
        {
            if (category_type === 0 && user_role === 'user')
                return false;
            else
            {
                if(user_role === 'member')
                    user_role = 'user';
                 //1 check for ownership
                //create function to check for post ownership
                ownsPost = true // for now true ownsPost()
                if(!ownsPost)
                    return false;
                else
                {
                    const permission = ac.can(user_role).updateOwn('post');
                    return permission.granted;
                }
            }
        }
    }
    else if(operation === 'delete')
    {
        if(user_role === 'guest')
            return false;
        if(element === 'category')
        { 
            if(user_role === 'member')
                user_role = 'user';
            //findRole, checks the users role in the category
            const permission = (user_role === 'moderator')
                   ? ac.can(user_role).deleteOwn('category') // if moderator then update own
                   : ac.can(user_role).deleteAny('category'); // if not moderator check if admin
            //NEED TO UPDATE USER TO MODERATOR on categ. creation
            return permission.granted;
        }
        else // element is either post or reply
        {
            if (category_type === 1)
            {
                if(user_role === 'member')
                    user_role = 'user';
                //1 check for ownership
                //create function to check for post ownership
                ownsPost = true // for now true ownsPost()
                const permission = (ownsPost)
                    ?ac.can(user_role).deleteOwn('post')
                    :ac.can(user_role).deleteAny('post');
                return permission.granted;
            }
            //instead of retrun true, I need to check if the user owns the comment or reply...
            else if(category_type === 0)// if private
            {
                if(user_role === 'user')
                    return false;
                else
                {
                    if(user_role === 'member')
                        user_role = 'user'
                    //1 check for ownership
                    //create function to check for post ownership
                    ownsPost = true // for now true ownsPost()
                    const permission = (ownsPost)
                        ?ac.can(user_role).deleteOwn('post')
                        :ac.can(user_role).deleteAny('post');
                    return permission.granted;
                }
            }
        }

    }
    return false; // by default 
}

function testAC()
{
    let operations = ['read','create','update','delete'];
    let elements = ['category', 'post', 'reply'];
    let roles = ['guest','user','member', 'moderator', 'admin'];
    let i = 0
    for(i; i < roles.length; i++)
    {
        let j = 0
        for(j; j < operations.length; j++)
        {
            let k = 0
            for(k; k < elements.length; k++)
            {
                //hasAccess(operation, element, role, category_id, type)
                let tempp = hasAccess(operations[j], elements[k], roles[i], 1, 1);
                console.log(roles[i], operations[j], elements[k], tempp);
            }
        }
    }
}

//testAC();

// ===============================================================================

let tempuserid = 2;

function newcategory (req, res, next) {
    // Create new category
    // /newcategory?categoryname=___&public=___
// AccessControl(tempuserid, qobj.categoryname, function(canaccess){
//    if (canaccess) {
//    }
//    else {
//        res.send("permission denied");
//        console.log("permission denied");
//        next();
//    }
// });
    let qobj = req.query;
    if (qobj.categoryname != undefined && qobj.public != undefined) {
        // category name should be alpha only
        // public should be boolean only

        let sqlquery = "INSERT INTO categories(title, public) VALUES(?, ?)";
        let myresult = "inserted";

        console.log(qobj.categoryname, qobj.public);

        db.run(sqlquery, [qobj.categoryname, qobj.public]);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function deletecategory (req, res, next) {
    // Delete category:
    // /deletecategory?categoryid=___

    let qobj = req.query;
    if (qobj.categoryid != undefined) {
        // categoryid should be int only

        let sqlquery = "DELETE FROM categories WHERE category_id=" + qobj.categoryid;

        // also do:
        // let sqlquery = "DELETE FROM posts WHERE category_id=?";
        // let sqlquery = "DELETE FROM replies WHERE category_id=?";

        let myresult = "deleted";

        db.run(sqlquery, function(err) {
            sqlquery = "DELETE FROM posts WHERE category_id=" + qobj.categoryid;
            db.run(sqlquery, function(err) {
                sqlquery = "DELETE FROM replies WHERE category_id=" + qobj.categoryid;
                db.run(sqlquery);
            });
        });

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function getcategorynames (req, res, next) {
    // Get categorynames:
    // /getcategorynames
    console.log(req.user);

    let sqlquery = "SELECT * FROM categories";

    db.all(sqlquery, function(err, rows) {
        res.send(rows);
    });
}

function getcategoryposts (req, res, next) {
    // Get categoryposts:
    // /getcategoryposts?categoryid=___

    let qobj = req.query;
    if (qobj.categoryid != undefined) {
        // categoryid should be int only

        let sqlquery = "SELECT * FROM posts WHERE category_id=" + qobj.categoryid;

        db.all(sqlquery, function(err, rows) {
            res.send(rows);
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function newpost (req, res, next) {
    // Create new post
    // /newpost?categoryid=___                            [title, content]

    let qobj = req.query;
    if (qobj.categoryid != undefined) {
        let sqlquery = "INSERT INTO posts(category_id, date_created, title, content) VALUES(?, ?, ?, ?)";
        
        let new_title = SqlString.escape(req.body.title);
        let new_content = SqlString.escape(req.body.content);
        let new_datetime = new Date(); 
        new_datetime = SqlString.escape(new_datetime);

        let myresult = "inserted";

        db.run(sqlquery, [qobj.categoryid, new_datetime, new_title, new_content]);

        console.log("creating: ", qobj.categoryid, new_datetime, new_title, new_content);
        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function editpost (req, res, next) { // ################################fix string
    // Edit post:
    // /editpost?categoryid=___&postid=___                [title, content]

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined) {
        let sqlquery = "UPDATE posts SET title=?, content=? WHERE category_id=? AND post_id=? LIMIT 1";
        
        let new_title = SqlString.escape(req.body.title);
        let new_content = SqlString.escape(req.body.content);

        let myresult = "edited";

        db.run(sqlquery, [new_title, new_content, qobj.categoryid, qobj.postid]);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}
function deletepost (req, res, next) {
    // Delete post:
    // /deletepost?categoryid=___&postid=___

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined) {
        let sqlquery = "DELETE FROM posts WHERE category_id="+qobj.categoryid+" AND post_id="+qobj.postid;
        let myresult = "deleted";

        db.run(sqlquery);

        sqlquery = "DELETE FROM replies WHERE category_id="+qobj.categoryid+" AND post_id="+qobj.postid;
        db.run(sqlquery);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function getpost (req, res, next) { // ################################fix string
    // Get post (and replies)
    // /getpost?categoryid=___&postid=___
    console.log("Get post req user: ", req.user);
    console.log("Authenticated? ", req.isAuthenticated());


    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined) {
        // categoryid should be int only

        let sqlquery = "SELECT * FROM posts WHERE category_id=? AND post_id=?";

        db.get(sqlquery, [qobj.categoryid, qobj.postid], function(err, row) {
            sqlquery = "SELECT * FROM replies WHERE category_id=? AND post_id=?";

            db.all(sqlquery, [qobj.categoryid, qobj.postid], function(err, rows) {
                res.send([row, rows]);
            });
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function newreply (req, res, next) {
    // Create new reply
    // /newreply?categoryid=___&postid=___                [content]

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined) {
        let sqlquery = "INSERT INTO replies(category_id, post_id, date_created, content) VALUES(?, ?, ?, ?)";
        
        // let new_title = SqlString.escape(req.body.title);
        let new_content = SqlString.escape(req.body.content);
        let new_datetime = new Date(); 
        new_datetime = SqlString.escape(new_datetime);

        let myresult = "inserted";

        db.run(sqlquery, [qobj.categoryid, qobj.postid, new_datetime, new_content]);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function editreply (req, res, next) { // ################################fix string
    // Edit reply:
    // /editreply?categoryid=___&postid=___&replyid=___   [content]

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined && qobj.replyid != undefined) {
        let sqlquery = "UPDATE replies SET content=? WHERE category_id=? AND post_id=? AND reply_id=? LIMIT 1";
        
        let new_content = SqlString.escape(req.body.content);

        let myresult = "edited";

        db.run(sqlquery, [new_content, qobj.categoryid, qobj.postid, qobj.replyid]);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function deletereply (req, res, next) {
    // Delete reply:
    // /deletereply?categoryid=___&postid=___&replyid=___

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined && qobj.replyid != undefined) {
        // console.log(qobj.categoryid, qobj.postid, qobj.replyid);
        let sqlquery = "DELETE FROM replies WHERE category_id="+qobj.categoryid+" AND post_id="+qobj.postid+" AND reply_id="+qobj.replyid;

        let myresult = "deleted";

        db.run(sqlquery);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function getuserroles(userid, cb) {
    let sqlquery = "SELECT * FROM roles WHERE user_id=" + userid;

    db.all(sqlquery, function(err, rows) {
        cb(err, rows);
    });
}


function getuserprofile (req, res, next) {
    // could be handled by the session cookie, but don't. 
    // need to check if user is able to get info on userid
    // getuserprofile?userid=___
    // username, role, [owned_categories], [moderator_categories], [user_categories]

    let qobj = req.query;
    if (qobj.userid != undefined) {
        // console.log("finding user " + qobj.userid);

        users.find_userid(qobj.userid, db, function(err, row) {
            // console.log(err, row);
            if(err) {
                console.log("finding user error");
                res.send(null);
            }
            else if(row == null) {
                // console.log("no users found")
                res.send(null);
            }
            else {
                // don't send the password! 
                // get roles

                getuserroles(qobj.userid, function(roles_err, roles_rows) {
                    if(roles_err) {
                        console.log("finding roles error");
                        res.send(null);
                    }
                    else {
                        let owned_categories = [];
                        let moderator_categories = [];
                        let user_categories = [];

                        for(let i = 0; i < roles_rows.length; i++) {
                            if (roles_rows[i].role == 1) {// owner
                                owned_categories.push(roles_rows[i].category_id);
                            }
                            else if (roles_rows[i].role == 2) {// moderator
                                moderator_categories.push(roles_rows[i].category_id);
                            }
                            else if (roles_rows[i].role == 3) {// user
                                user_categories.push(roles_rows[i].category_id);
                            }
                        }
                        let myresult = {"id": row.id,"username": row.username, "role": row.role, "owned_categories": owned_categories, "moderator_categories": moderator_categories, "user_categories": user_categories};
                        console.log("sending: ", myresult);
                        res.send(myresult);
                    }
                });
            }
        });

        
    }
    else {
        console.log("Undefined");
        next();
    }

}

function getauthor( req, res, next ) {
    // getauthor?userid=___
    let qobj = req.query;
    if (qobj.userid != undefined) {
        // console.log("finding user " + qobj.userid);

        users.find_userid(qobj.userid, db, function(err, row) {
            // console.log(err, row);
            if(err) {
                console.log("finding user error");
                res.send(null);
            }
            else if(row == null) {
                // console.log("no users found")
                res.send(null);
            }
            else {
                res.send(row);
            }
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function gettable( req, res, next) {
    // get table - for debugging only
    // /gettable?table=___

    let qobj = req.query;
    if(qobj.table != undefined) {
        let sqlquery = "SELECT * FROM " + qobj.table;

        db.all(sqlquery, function(err, rows) {
            res.send(rows);
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function create_user(req,res,next) {
    let qobj = req.query;
    let username = req.body.username;
    let password = req.body.password;
    console.log("body:", username, password);

    // make input validation more strict! 
    if(username != "" && password != "" && username != null && password != null) {
        users.add_user(username,password,db, 
            function(err) {
                if(err) { console.log("Error, sign up attempt failed"); }
                else {
                    console.log("Signed up new user:". username, password);
                    res.send("Sign-Up successful");
                }
            }
        );
    }
    else {
        console.log("Username or password undefined");
        next();
    }
}
// ===============================================================================

function fileNotFound(req, res) {
    let url = req.url;
    res.type('text/plain');
    res.status(404);
    res.send('Cannot find '+url);
    }

// server router

app.use(express.static('public'));  // can I find a static file? 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use(flash());

// app.get('/getposts', getpostsHandler);
// app.post('/newpost', newpostHandler);
// app.get('/clearposts', clearpostsHandler);

app.get('/newcategory', newcategory);
app.get('/deletecategory', deletecategory);
app.get('/getcategorynames', getcategorynames);
app.get('/getcategoryposts', getcategoryposts);

app.post('/newpost', newpost);
app.post('/editpost', editpost);
app.get('/deletepost', deletepost);
app.get('/getpost', getpost);

app.post('/newreply', newreply);
app.post('/editreply', editreply);
app.get('/deletereply', deletereply);

app.get('/getuserprofile', getuserprofile);
app.get('/getauthor', getauthor);

app.post('/create_user', create_user);
// TODO: sucessRedirect to user profile, failureRedirect to login page

app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/login.html')); 
});
app.get('/signup', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/signup.html')); 
});
app.get('/loginfailure', function(req, res) {
    res.status(401);
    res.send("Login failure"); 
});
app.get('/loginsuccess', function(req, res) {
    res.status(200);
    res.send("Login success"); 
});
app.post('/login', passport.authenticate('local', { successRedirect: '/loginsuccess',
                                                    failureRedirect: '/loginfailure',
                                                    failureFlash: false })//,
    // function(req, res) {
    //     res.redirect()
    // }
);
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login.html');
});

app.get('/gettable', gettable);

/* SERVER 

Create new category:    GET  /newcategory?categoryname=___&public=___
Delete category:        GET  /deletecategory?categoryid=___
Get categorynames:      GET  /getcategorynames
    
Get categoryposts:      GET  /getcategoryposts?categoryid=___

Create new post:        POST /newpost?categoryid=___                            [title, content]
Edit post:              POST /editpost?categoryid=___&postid=___                [title, content]
Delete post:            GET  /deletepost?categoryid=___&postid=___
Get post (and replies): GET  /getpost?categoryid=___&postid=___

Create new reply:       POST /newreply?categoryid=___&postid=___                [content]
Edit reply:             POST /editreply?categoryid=___&postid=___&replyid=___   [content]
Delete reply:           GET  /deletereply?categoryid=___&postid=___&replyid=___

*/

app.use( fileNotFound ); 

const server = app.listen(process.env.PORT || port, () => {
    console.log(`App listening on port ${port}`);
});

module.exports = app;


/*
function checkAccess(user_id, category_id)
{
    users.find_userid(user_id, db, function(err, row) {
        console.log(row);
        if(row == null)
        {
            user_role = 'guest';
            //function hasAccess(operation, element, user_role, type)
            //hasAccess(operation, element, user_role, 1)
        }
        else if (row.role === 1)
            user_role = 'admin';

        else // if user is not guest or admin, get role from roles
        {
             getSingleRole(user_id, category_id, function(roles_err, roles_row) {
                if(roles_err)
                    console.log("finding roles error");
                else
                {
                    if(roles_row == null)
                        user_role = 'user';
                    else if (roles_row.role == 1)
                        user_role = 'member';
                    else if (roles_row.role == 2)
                        user_role = 'moderator'
                    console.log(roles_row);
                }
                //AC func
            });
        }
    });
    //function getuserroles(userid, cb)
    // check if user is admin, if it is retrun admin
    // if not check it is a moderator, or member(user) of a private function

    //DONE if user_id not in usr database, return guest
    //DONE if user_id in usr data base and is admin, return admin
    //if user_id in usr data base but not in category database, return user
    //if user_id in both usr and category databasem return memeber
    //      a memebr has the same privs. as user inside the private 
    //if user_id inside category and is a moderator, return moderator
}
*/
