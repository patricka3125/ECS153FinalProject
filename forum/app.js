const express = require('express');
const bodyParser = require("body-parser");
const port = 8080;

// https://www.techiediaries.com/node-sqlite-crud/
const sqlite3 = require("sqlite3").verbose();  // use sqlite
const fs = require("fs");

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

        // users: id, user_id, password
        db.run("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,"
            + "username VARCHAR(45), password VARCHAR(45))", creationerror(err));
    }
});

function creationerror(err) {
    if(err) {
        console.log(err);
    }
}

// // https://www.techiediaries.com/node-sqlite-crud/
// function readsql() {
//     console.log("Read data from basicposts");
//     db.all("SELECT rowid AS id, title, date, content FROM basicposts", function(err, rows) {
//         rows.forEach(function (row) {
//             console.log(row.id + ": " + row.title + "; " + row.date + "; " + row.content);
//         });
//     });
// }

// function newpostHandler(req, res, next) {
//     // let url = req.url;
//     // let qObj = req.query;
//     // console.log(qObj);
//     // console.log(typeof(req));
//     // console.log()
//     let title = SqlString.escape(req.body.title);
//     let content = SqlString.escape(req.body.content);
//     let datetime = new Date(); //.toUTCString();
//     datetime = SqlString.escape(datetime);
//     console.log(req.body, req.body.title, req.body.content);

//     db.run('INSERT INTO basicposts(title, date, content) VALUES (?, ?, ?)', [title, datetime, content]);

//     readsql();

//     res.send("done!");
// }

// function getpostsHandler(req, res, next) {
    
//     db.all("SELECT rowid AS id, title, date, content FROM basicposts", function(err, rows) {
//         res.send(rows);
//     });

// }

// function clearpostsHandler(req, res, next) {
    
//     db.all("DELETE FROM basicposts");
//     res.send("done!");

// }

// ===============================================================================

function newcategory (req, res, next) {
    // Create new category
    // /newcategory?categoryname=___&public=___

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
    if(qobj.username != undefined && qobj.password != undefined) {
        let sqlquery = "INSERT INTO users (username,password)" 
            + "VALUES(?,?)";

        let myresult = "sign up success!";

        db.run(sqlquery, [qobj.username, qobj.password]);
        res.send(myresult);
    }
    else {
        console.log("Undefined");
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

// put together the server pipeline
const app = express()

app.use(express.static('public'));  // can I find a static file? 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
app.get('/create_user', create_user);

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
