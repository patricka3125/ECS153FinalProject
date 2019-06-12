const bcrypt            = require('bcrypt');

exports.add_user = function(username,password,db,cb) {
    if(!db) { cb(new Error('DB does not exist')); }
    bcrypt.hash(password, 10, function(err, hash) {
        let sqlquery = "INSERT INTO users (username, password, role) VALUES(?,?,?)";
        if(err) console.log("error hashing: " + err);
        console.log("hash: "+hash);
        db.run(sqlquery, [username,hash,0], function(err) {
            if(err) cb(err);
            else cb(null);
        }); // for now, default role as 0 (non-admin)
        
    });
    
}

exports.find_user = function(username,db,cb) {
    if(!db) { cb(new Error('DB does not exist')); }

    let sqlquery = "SELECT * FROM users WHERE username=?";
    // console.log(username);
    db.all(sqlquery, [username], function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}

exports.find_userid = function(userid,db,cb) {
    if(!db) { cb(new Error('DB does not exist')); }

    let sqlquery = "SELECT id, username, role FROM users WHERE id=?";

    db.all(sqlquery, [userid],function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}

exports.validate_userpass = function(username,password,db, cb) {
    if(!db) { cb(new Error('DB does not exist')); }

    let sqlquery = "SELECT * FROM users WHERE username=?";

    db.all(sqlquery, [username],function(err, rows) {
        if(err) { 
            cb(err, null);
        }
        else if(rows.length < 1) { 
            cb(err, null);
        }
        else {
            bcrypt.compare(password, rows[0].password, function(err, res) {
                if(res) {
                    // Passwords match
                    delete rows[0].password;
                    cb(err, rows[0]);
                } else {
                    // Passwords don't match
                    cb(err, null);
                } 
            });
        }
    });
}
