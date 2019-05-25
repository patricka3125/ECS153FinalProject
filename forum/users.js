exports.add_user = function(username,password,db,cb) {
    if(!db) { cb(new Error('DB does not exist')); }

    let sqlquery = "INSERT INTO users (username, password, role) VALUES(?,?,?)";

    db.run(sqlquery, [username,password,1]); // for now, default role as 1
    cb(null);
}

exports.find_user = function(username,db,cb) {
    if(!db) { cb(new Error('DB does not exist')); }

    // TODO: vulnerable to SQL injection
    let sqlquery = "SELECT * FROM users WHERE username=" + username;

    db.all(sqlquery, function(err, rows) {
        if(err) { cb(err,null); }
        if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}

exports.valid_password = function(username,password,db) {
    if(!db) { cb(new Error('DB does not exist')); }

    let sqlquery = "SELECT * from users where username=" + username
                   + "AND password=" + password;

    db.all(sqlquery, function(err, rows) {
        if(err) { return false; }
        if(rows.length < 1) {
            return false;
        }else {
            return true;
        }
    });
}
