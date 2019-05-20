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
        console.log('Created/connected to the database.');
        console.log("create database table basicposts");
        db.run("CREATE TABLE IF NOT EXISTS basicposts(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, date DATETIME, content TEXT)"); //,  insertData);
    }
});


// // mysql
// var mysql = require('mysql');

// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'forumadmin',
//     password : 'ecs153password',
//     database : 'mango'
// });

// connection.connect((err) => {
//     if (err) throw err;
//     console.log('Connected!');
// });

// // CREATE TABLE tablename ( id smallint unsigned not null auto_increment, name varchar(20) not null, constraint pk_example primary key (id) );
// // INSERT INTO tablename ( id, name ) VALUES ( null, 'Sample data' );

function queryHandler(req, res, next) {
    let url = req.url;
    let qObj = req.query;
    console.log(qObj);
    
    if (qObj.english != undefined) {
	    // res.json( {"beast" : qObj.animal} );
        // res.json({ "palindrome": qObj.word + qObj.word.split("").reverse().join("") })
        res.json({ "English": qObj.english, "Chinese (Traditional)": translation});
    }
    else {
	next();
    }
}

// https://www.techiediaries.com/node-sqlite-crud/
function readsql() {
    console.log("Read data from basicposts");
    db.all("SELECT rowid AS id, title, date, content FROM basicposts", function(err, rows) {
        rows.forEach(function (row) {
            console.log(row.id + ": " + row.title + "; " + row.date + "; " + row.content);
        });
    });
}

function newpostHandler(req, res, next) {
    // let url = req.url;
    // let qObj = req.query;
    // console.log(qObj);
    // console.log(typeof(req));
    // console.log()
    let title = SqlString.escape(req.body.title);
    let content = SqlString.escape(req.body.content);
    let datetime = new Date(); //.toUTCString();
    datetime = SqlString.escape(datetime);
    console.log(req.body, req.body.title, req.body.content);

    db.run('INSERT INTO basicposts(title, date, content) VALUES (?, ?, ?)', [title, datetime, content]);

    readsql();

    res.send("done!");
}

function getpostsHandler(req, res, next) {
    
    db.all("SELECT rowid AS id, title, date, content FROM basicposts", function(err, rows) {
        res.send(rows);
    });

}

function clearpostsHandler(req, res, next) {
    
    db.all("DELETE FROM basicposts");
    res.send("done!");

}

function fileNotFound(req, res) {
    let url = req.url;
    res.type('text/plain');
    res.status(404);
    res.send('Cannot find '+url);
    }

// put together the server pipeline
const app = express()

app.use(express.static('public'));  // can I find a static file? 

app.get('/query', queryHandler );   // if not, is it a valid query?

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/getposts', getpostsHandler);
app.post('/newpost', newpostHandler);
app.get('/clearposts', clearpostsHandler);

/* SERVER 

Create new category:    GET  /newcategory?categoryname=___
Delete category:        GET  /deletecategory?categoryid=___
Get categorynames:      GET  /getcategorynames
    
Get categoryposts:      GET  /getcategoryposts?categoryid=___

Create new post:        POST /newpost?categoryid=___                            [title, content]
Edit post:              POST /editpost?categoryid=___&postid=___                [title, content]
Delete post:            GET  /deletepost?categoryid=___&postid=___
Get post (and replies): GET  /getpost?categoryid=___&postid=___

Create new reply:       POST /newreply?categoryid=___&postid=___                [content]
Edit reply:             POST /editreply?categoryid=___&postid=___&replyid=___   [content]

*/

// app.get('/newpost', newpostHandler );   // if not, is it a valid query?
// app.get('/translate', queryHandler );   // if not, is it a valid query?
app.use( fileNotFound );            // otherwise not found

// app.listen(port, function (){console.log('Listening...');} )
 
if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
    // db.close((err) => {
    //     if (err) {
    //         return console.error(err.message);
    //     }
    //     console.log('Closed database.');
    // });
}

module.exports = app;