exports.add_user = function(username,password,db,cb) {
    if(!db) { cb(true); }

    let sqlquery = "INSERT INTO users (username, password, role) VALUES(?,?,?)";

    db.run(sqlquery, [username,password,1]); // for now, default role as 1
    cb(false);
}
