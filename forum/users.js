exports.add_user = function(username,password,db,cb) {
    if(!db) { cb(new Error('DB does not exist')); }

    let sqlquery = "INSERT INTO users (username, password, role) VALUES(?,?,?)";

    db.run(sqlquery, [username,password,0]); // for now, default role as 0 (non-admin)
    cb(null);
}

exports.find_user = function(username,db,cb) {
    if(!db) { cb(new Error('DB does not exist')); }

    // TODO: vulnerable to SQL injection
    let sqlquery = "SELECT * FROM users WHERE username=" + username;

    db.all(sqlquery, function(err, rows) {
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

    // TODO: vulnerable to SQL injection
    let sqlquery = "SELECT id, username, role FROM users WHERE id=" + userid;

    db.all(sqlquery, function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
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
        else if(rows.length < 1) {
            return false;
        }else {
            return true;
        }
    });
}
