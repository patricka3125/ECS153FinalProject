const express = require('express')
const port = 57769

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

function fileNotFound(req, res) {
    let url = req.url;
    res.type('text/plain');
    res.status(404);
    res.send('Cannot find '+url);
    }

// put together the server pipeline
const app = express()
app.use(express.static('public'));  // can I find a static file? 
// app.get('/query', queryHandler );   // if not, is it a valid query?
app.get('/translate', queryHandler );   // if not, is it a valid query?
app.use( fileNotFound );            // otherwise not found

app.listen(port, function (){console.log('Listening...');} )
 
