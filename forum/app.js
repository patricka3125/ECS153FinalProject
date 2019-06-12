// ===== dependancies =====

const express           = require('express');
const bodyParser        = require("body-parser");
const sqlite3           = require("sqlite3").verbose();  // use sqlite
const fs                = require("fs");
const users             = require('./users');
const accesscontrol     = require('./accesscontrol');
const passport          = require('passport');
const LocalStrategy     = require('passport-local').Strategy; //passport local strategy
const session           = require('express-session');//({ secret: 'mango', resave: false, saveUninitialized: false });
const path              = require('path');
const rateLimit         = require("express-rate-limit");
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

// ===== Rate Limiter =====
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// ========== PASSPORT (Authentication) CODE ==================================

app.use(session({ secret: 'mango', cookie: {secure: false, httpOnly: true, maxAge: 6 * 60 * 60 * 1000}, resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function(username, password, done) {
        // find username from db
        users.validate_userpass(username, password, db, function(err,user) {
            if(err) { 
                done(err); 
            }
            else if(user == null) {
                // return done(null, false, { message: 'Incorrect username.' });
                console.log("invalid user/pass");
                return done(null, false);
            }
            else {
                console.log("logged in", user.username);
                return done(null, user);
            }
            
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
//                       TESTING ACCESS CONTROL
// ============================================================================


/*accesscontrol.checkAccess() function takes in user_id and the appropriate element
    to be modified as well as the requested by the user operation.

    ***IMPORTANT***
    - when you need to check access for operations on a category, input -1 
        for both reply_id and post_id.
    - when you need to check acccess for operation on a post, input -1 for reply_id.
    - when you need to check acceess for operation on a reply, input all required vars.
    *user_id, cat_id, oper, elem can be removed form the callback, they are only included
            for testing purposes
*/

/*This is just a function to test the correctness of checkAccess() function */
function testCheckAC()
{
    let operations = ['read','create','update','delete'];
    let elements = ['category', 'post', 'reply'];
    let user_ids = [1,2,3,4];
    let category_ids = [1,2, 4];
    let i = 0;
    for(i; i < category_ids.length; i++)
    {
        let j = 0;
        for(j; j < operations.length; j++)
        {
            let k = 0;
            for(k; k < elements.length; k++)
            {
                // checkAccess(user_id, category_id, post_id, reply_id, operation, element, cb)
                accesscontrol.checkAccess(2, category_ids[i], 1, 5, operations[j], elements[k], db, function(usr_id, cat_id, oper, elm, accessGranted) {
                     // if(accessGranted)
                     //    console.log(usr_id, cat_id, oper, elm, accessGranted);
                }); 
            }
        }
    }
}
// tested admin 
//        - update when owns/doesn't own reply +
//        - update when owns/doesn't own post +
//        - update when owns/doesn't own category +
//      guest
//        - so far works good but still need to test
//      moderator
//        - update when owns/doesn't own reply +
//        - update when owns/doesn't own post +
//        - update when owns/doesn't own category +
//      user
//        - update when owns/doesn't own reply -
//        - update when owns post +
//        - update when owns/doesn't own category +
testCheckAC();

// ============================================================================


// ===== Begin Category Handlers =====

function newcategory (req, res, next) {
    // Create new category
    // /newcategory?categoryname=___&public=___

    let qobj = req.query;
    if (qobj.categoryname != undefined && qobj.public != undefined) {
        // category name should be alpha only
        // public should be boolean only

        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        //user_id, category_id, post_id, reply_id, operation, element, cb
        accesscontrol.checkAccess(currentuser, -1, -1, -1, 'create', 'category', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            //console.log(accessGranted);
            if(accessGranted)
            {
                //console.log(usr_id, cat_id, oper, elm, accessGranted);
                let sqlquery = "INSERT INTO categories(title, public) VALUES(?, ?)";
                let myresult = "inserted";

                console.log(qobj.categoryname, qobj.public);

                // create the new category
                db.run(sqlquery, [qobj.categoryname, qobj.public], function(err) {

                    // get the new category's id
                    sqlquery = "SELECT category_id FROM categories WHERE title=?";

                    db.all(sqlquery, [qobj.categoryname],function(err, rows) {
                        newcategoryid = rows[0].category_id;
                        sqlquery = "INSERT INTO roles(user_id, category_id, role) VALUES(?, ?, ?)";
                        db.run(sqlquery, [req.user.id, newcategoryid, 1], function(err) { // 1=owner
                            res.send(myresult);
                        });
                    });
                });
            }
            else
            {
                //add apropriate status
                //res.status(401);
                res.send("Category: failed to create");
            }
        });
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
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        //user_id, category_id, post_id, reply_id, operation, element, cb
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'delete', 'category', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can delete: ",accessGranted, "category id is: ",cat_id);
            if(accessGranted)
            {
                let sqlquery = "DELETE FROM categories WHERE category_id=?";
                let myresult = "deleted";
                db.run(sqlquery, [qobj.categoryid], function(err) {
                    sqlquery = "DELETE FROM posts WHERE category_id=?";
                    db.run(sqlquery, [qobj.categoryid], function(err) {
                        sqlquery = "DELETE FROM replies WHERE category_id=?";
                        db.run(sqlquery, [qobj.categoryid], function(err) {
                            sqlquery = "DELETE FROM roles WHERE category_id=?";
                            db.run(sqlquery, [qobj.categoryid]);
                        });
                    });
                });
                res.send(myresult);
            }
            else
            {
                //add apropriate status
                //res.status(401);
                res.send("Category: failed to delete");
                next(); // is next the right thing to do ???
                // the program breaks when the category doesn't exist eg. -1

            }
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function getcategorynames (req, res, next) {
    // Get categorynames:
    // /getcategorynames
    
    let sqlquery = "SELECT * FROM categories";

    if(req.isAuthenticated()) {
        // get public + member categories
        db.all(sqlquery, function(err, rows) {
            getuserroles(req.user.id, function(roles_err, roles_rows) {
                if(roles_err) {
                    console.log("finding roles error");
                    res.send(null);
                }
                else {
                    let parsedrolestable = parse_userrolestable(roles_rows);
                    let myresult = {"id": req.user.id, "username": req.user.username, "role": req.user.role};
                    myresult = Object.assign({}, myresult, parsedrolestable);

                    // myresult = parse_userrolestable(roles_rows);
                    console.log(myresult);
                    checkedrows = [];

                    for(let i = 0; i < rows.length; i++) {
                        currentid = rows[i].category_id;
                        if( myresult.owned_categories.includes(currentid) ||
                            myresult.moderator_categories.includes(currentid) || 
                            myresult.user_categories.includes(currentid) || 
                            rows[i].public == 1 ||
                            req.user.role == 1
                            ) {
                            checkedrows.push(rows[i]);
                        }
                    }
                    
                    res.send(checkedrows);
                }
            });

            // res.send(rows);
        });

    }
    else {
        // get public categories
        sqlquery += " WHERE public=1";
        db.all(sqlquery, function(err, rows) {
            res.send(rows);
        });
    }
    
}

function getcategoryposts (req, res, next) {
    // Get categoryposts:
    // /getcategoryposts?categoryid=___

    let qobj = req.query;
    if (qobj.categoryid != undefined) {
        // categoryid should be int only

        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        accesscontrol.checkAccess(currentuser, qobj.categoryid, null, null, "read", null, db, function(usr_id, cat_id, oper, elm, accessGranted) {
            if(accessGranted) {
                let sqlquery = "SELECT * FROM posts WHERE category_id=?";

                db.all(sqlquery, [qobj.categoryid], function(err, rows) {
                    res.send(rows);  
                });
            }
            else {
                res.status(401);
                res.send("Unauthorized: Private category");
            }
        });  
    }
    else {
        console.log("Undefined");
        next();
    }
}

// ===== Begin Category Settings Handlers =====

function updatevisibility(req, res, next) {
    // update visibility of category
    // /updatevisibility?categoryid=___&visibility=___
    let qobj = req.query;
    if (qobj.categoryid != undefined && (qobj.visibility == 0 || qobj.visibility == 1)) {
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'delete', 'category', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can update: ",accessGranted, "category id is: ",cat_id);
            if(accessGranted)
            {
                let sqlquery = "UPDATE categories SET public=? WHERE category_id=?";

                db.run(sqlquery, [qobj.visibility, qobj.categoryid], function(err) {
                    res.send("Updated visibility");
                });
            }
            else {
                res.status(401);
                res.send("Visibility: failed to update");
            }
        });
    }
    else {
        res.send("Visibility: failed to update");
        next();
    }

}

function getcategoryusers(req, res, next) {
    // get users of category
    // /getcategoryusers?categoryid=___
    let qobj = req.query;
    if (qobj.categoryid != undefined) {
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'read', 'category', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can view users: ",accessGranted, "category id is: ",cat_id);
            if(accessGranted)
            {
                // SELECT category_id, user_id, roles.role, username FROM roles INNER JOIN users on users.id=roles.user_id WHERE category_id=4;
                let sqlquery = " SELECT user_id, roles.role, username FROM roles INNER JOIN users on users.id=roles.user_id WHERE category_id=?";

                db.all(sqlquery, [qobj.categoryid], function(err, rows) {
                    if(err) {
                        res.send("cannot view users");
                    }
                    else {
                        res.send(rows);
                    }
                });
            }
            else {
                res.status(401);
                // res.send("Visibility: failed to update");
            }
        });
    }
    else {
        res.send("cannot view users");
        next();
    }

}

function updateuser (req, res, next) {
    // update user role within category
    // "/updateuser?categoryid=" + categoryid + "&userid=" + userid + "&role=" + userrole;
    let qobj = req.query;
    if(qobj.categoryid != undefined && qobj.userid != undefined && qobj.role != undefined) {
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'update', 'category', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can updateuser: ",accessGranted);
            if(accessGranted)
            {
                let sqlquery = "UPDATE roles SET role=? WHERE category_id=? AND user_id=?"
                db.run(sqlquery, [qobj.role, qobj.categoryid, qobj.userid], function(err) {
                    if(err) console.log("usererror", err);
                    else {
                        res.send("updated user");
                    }
                });
            }
            else {
                res.status(401);
                next(); 
            }
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function removeuser (req, res, next) {
    // remove user from category
    // "/removeuser?categoryid=" + categoryid + "&userid=" + userid;
    let qobj = req.query;
    if(qobj.categoryid != undefined && qobj.userid != undefined) {
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'update', 'category', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can deleteuser: ",accessGranted);
            if(accessGranted)
            {
                let sqlquery = "DELETE FROM roles WHERE category_id=? AND user_id=?";
                db.run(sqlquery, [qobj.categoryid, qobj.userid], function(err) {
                    if(err) console.log("usererror", err);
                    else {
                        res.send("removed user");
                    }
                });
            }
            else {
                res.status(401);
                next(); 
            }
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function adduser (req, res, next) {
    // add user to category
    // "/adduser?categoryid=" + currentcategory + "&username=" + username + "&role=" + userrole;
    let qobj = req.query;
    if(qobj.categoryid != undefined && qobj.username != undefined && qobj.role != undefined) {
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'update', 'category', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can adduser: ",accessGranted);
            if(accessGranted)
            {
                // match username to userid
                users.find_user(qobj.username, db, function(err, row) {
                    if(err) {
                        console.log("finding user error");
                        res.send("error adding");
                    }
                    else if(row == null) {
                        res.send("error adding");
                    }
                    else {
                        let sqlquery = "INSERT INTO roles(category_id, user_id, role) VALUES(?, ?, ?)";
                        db.run(sqlquery, [qobj.categoryid, row.id, qobj.role], function(err) {
                            if(err) console.log("usererror", err);
                            else {
                                res.send("added user");
                            }
                        });
                    }
                });
            }
            else {
                res.status(401);
                next(); 
            }
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}


// ===== Begin Post Handlers =====

function newpost (req, res, next) {
    // Create new post
    // /newpost?categoryid=___                            [title, content]

    let qobj = req.query;
    if (qobj.categoryid != undefined) {
        // categoryid should be int only
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        //user_id, category_id, post_id, reply_id, operation, element, cb
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'create', 'post', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can delete: ",accessGranted, "category id is: ",cat_id);
            if(accessGranted)
            {
                let sqlquery = "INSERT INTO posts(category_id, date_created, title, content, user_id) VALUES(?, ?, ?, ?, ?)";
                let new_title = SqlString.escape(req.body.title);
                let new_content = SqlString.escape(req.body.content);
                let new_datetime = new Date(); 
                new_datetime = SqlString.escape(new_datetime);
                let myresult = "inserted";
                db.run(sqlquery, [qobj.categoryid, new_datetime, new_title, new_content, req.user.id]);
                console.log("creating: ", qobj.categoryid, new_datetime, new_title, new_content);
                res.send(myresult);
            }
            else
            {
                res.status(401);
                res.send("Post: failed to create");
                next();
            }
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function editpost (req, res, next) { 
    // Edit post:
    // /editpost?categoryid=___&postid=___                [title, content]

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined) {
        let sqlquery = "UPDATE posts SET title=?, content=? WHERE category_id=? AND post_id=?";
        
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
                // categoryid should be int only
        let currentuser = null;
        if(req.isAuthenticated()) {
            currentuser = req.user.id;
        } 
        //user_id, category_id, post_id, reply_id, operation, element, cb
        accesscontrol.checkAccess(currentuser, qobj.categoryid, -1, -1, 'delete', 'post', db, function(usr_id, cat_id, oper, elm, accessGranted) {
            console.log("Can delete: ",accessGranted, "category id is: ",cat_id);
            if(accessGranted)
            {
                let sqlquery = "DELETE FROM posts WHERE category_id=? AND post_id=?";
                let myresult = "deleted";
                db.run(sqlquery, [qobj.categoryid, qobj.postid]);
                sqlquery = "DELETE FROM replies WHERE category_id=? AND post_id=?";
                db.run(sqlquery, [qobj.categoryid, qobj.postid]);
                res.send(myresult);
            }
            else
            {
                //add apropriate status
                res.status(401);
                res.send("Post: failed to delete");
                next(); // is next the right thing to do ???
                // the program breaks when the category doesn't exist eg. -1

            }
        });
    }
    else {
        console.log("Undefined");
        next();
    }
}

function getpost (req, res, next) { 
    // Get post (and replies)
    // /getpost?categoryid=___&postid=___

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

// ===== Begin Reply Handlers =====

function newreply (req, res, next) {
    // Create new reply
    // /newreply?categoryid=___&postid=___                [content]

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined) {
        let sqlquery = "INSERT INTO replies(category_id, post_id, date_created, content, user_id) VALUES(?, ?, ?, ?, ?)";
        
        let new_content = SqlString.escape(req.body.content);
        let new_datetime = new Date(); 
        new_datetime = SqlString.escape(new_datetime);

        let myresult = "inserted";

        db.run(sqlquery, [qobj.categoryid, qobj.postid, new_datetime, new_content, req.user.id]);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

function editreply (req, res, next) { 
    // Edit reply:
    // /editreply?categoryid=___&postid=___&replyid=___   [content]

    let qobj = req.query;
    if (qobj.categoryid != undefined && qobj.postid != undefined && qobj.replyid != undefined) {
        let sqlquery = "UPDATE replies SET content=? WHERE category_id=? AND post_id=? AND reply_id=?";
        
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
        let sqlquery = "DELETE FROM replies WHERE category_id=? AND post_id=? AND reply_id=?";

        let myresult = "deleted";

        db.run(sqlquery, [qobj.categoryid, qobj.postid, qobj.replyid]);

        res.send(myresult);
    }
    else {
        console.log("Undefined");
        next();
    }
}

// ===== Begin User Role Helpers =====

function getuserroles(userid, cb) {
    let sqlquery = "SELECT * FROM roles WHERE user_id=?";

    db.all(sqlquery, [userid], function(err, rows) {
        cb(err, rows);
    });
}

function parse_userrolestable(roles_rows) {
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
    let myresult = {"owned_categories": owned_categories, "moderator_categories": moderator_categories, "user_categories": user_categories};
    return myresult;
}

function getuserprofile (req, res, next) {
    // send user-assosciated data to client
    // id, username, role, [owned_categories], [moderator_categories], [user_categories]

    if (req.isAuthenticated()) {

        users.find_userid(req.user.id, db, function(err, row) {
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

                getuserroles(req.user.id, function(roles_err, roles_rows) {
                    if(roles_err) {
                        console.log("finding roles error");
                        res.send(null);
                    }
                    else {
                        let parsedrolestable = parse_userrolestable(roles_rows);

                        let myresult = {"id": row.id,"username": row.username, "role": row.role};
                        myresult = Object.assign({}, myresult, parsedrolestable);
                        
                        res.send(myresult);
                    }
                });
            }
        });

        
    }
    else {
        res.status(401);
        res.send("");
        console.log("Not logged in");
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
                // console.log("finding user error");
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

// ===== Begin Login/Signup Handlers =====

function create_user(req,res,next) {
    let qobj = req.query;
    let username = req.body.username;
    let password = req.body.password;
    console.log("body:", username, password);

    // make input validation more strict! 
    if(username != "" && password != "" && username != null && password != null) {
        users.add_user(username,password,db, 
            function(err) {
                if(err) { 
                    console.log("Error, sign up attempt failed: " + err); 
                    res.status(401);
                    res.send("Sign-Up failed");
                }
                else {
                    console.log("Signed up new user:". username);
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

app.use(limiter); // apply to all requests
app.use(express.static('public'));  // can I find a static file? 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// category methods
app.get('/newcategory', newcategory);
app.get('/deletecategory', deletecategory);
app.get('/getcategorynames', getcategorynames);
app.get('/getcategoryposts', getcategoryposts);

// category settings methods
app.get('/updatevisibility', updatevisibility);
app.get('/getcategoryusers', getcategoryusers);
app.get('/updateuser', updateuser);
app.get('/removeuser', removeuser);
app.get('/adduser', adduser);

// post methods
app.post('/newpost', newpost);
app.post('/editpost', editpost);
app.get('/deletepost', deletepost);
app.get('/getpost', getpost);

// reply methods
app.post('/newreply', newreply);
app.post('/editreply', editreply);
app.get('/deletereply', deletereply);

// user helper methods
app.get('/getuserprofile', getuserprofile);
app.get('/getauthor', getauthor);

// authentication methods
app.post('/create_user', create_user);
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
);
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login.html');
});

app.get('/gettable', gettable);

app.use( fileNotFound ); 

const server = app.listen(process.env.PORT || port, () => {
    console.log(`App listening on port ${port}`);
});

module.exports = app;