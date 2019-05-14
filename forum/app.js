const express = require('express');
const bodyParser = require("body-parser");
const port = 8080;

// https://www.techiediaries.com/node-sqlite-crud/
const sqlite3 = require("sqlite3").verbose();  // use sqlite
const fs = require("fs");

const dbFileName = "mango.db";

const db = new sqlite3.Database(dbFileName, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Created/connected to the database.');
    }
});

// const createTable = () => {
//     console.log("create database table posts");
//     db.run("CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)",  insertData);
// }

db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Closed database.');
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

function newpostHandler(req, res, next) {
    // let url = req.url;
    // let qObj = req.query;
    // console.log(qObj);
    // console.log(typeof(req));
    // console.log()
    let title=req.body.title;
    let content = req.body.content;
    console.log(req.body, req.body.title, req.body.content);
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

app.post('/newpost', newpostHandler);

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
}

module.exports = app;