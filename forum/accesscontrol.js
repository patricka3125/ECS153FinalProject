const AccessControl     = require('accesscontrol');
const users             = require('./users');


//DEFINING THE ACCESS CONTROL BASIC STRUCTURE, WITHOUT PRIVATE, private is checked later

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
        .deleteOwn('category')
        .updateOwn('category') 
        .deleteAny('post')
        .deleteAny('reply')
    .grant('admin')
        .extend('moderator')
        .deleteAny('category');
        

function getSingleRole(userid, categoryid, db, cb) {
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

function getSingleCategory(categoryid, db, cb) {
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

function getSinglePost(categoryid, post_id, user_id, db, cb) {
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
getSinglePost(1, 1, 2, function(posts_err, posts_row) {
    if(posts_err)
        console.log("Error! Can't find posts!");
    else
    {
        console.log("Batence" , posts_row);
    }
});
*/

function getSingleReply(categoryid, post_id, user_id, reply_id, db, cb) {
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

function checkOwnership(category_id, user_id, post_id, reply_id, db, cb)
{
    if(reply_id === -1)
    {
        getSinglePost(category_id, post_id, user_id, db, function(posts_err, posts_row) {
            if(posts_err)
                console.log("Error! Can't find posts!");
            else
            {
                //console.log(posts_row);
                if(posts_row == null)
                    cb(false);
                else
                    cb(true);
            }
        });
        return;
    }
    else if(post_id !== -1)
    {
        getSingleReply(category_id, post_id, user_id, reply_id, db, function(replies_err, replies_row) {
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
    else
        cb(false);
}
//4,3,2,-1, should return true
// checkOwnership(4, 3, 2, 6, function(condition) {
//     console.log(condition);
// });





exports.checkAccess = function(user_id, category_id, post_id, reply_id, operation, element, db, cb) {
    users.find_userid(user_id, db, function(users_err, users_row) {
        if(users_err)
            console.log("Error! Can't find users!");
        else 
        {
            getSingleRole(user_id, category_id, db, function(roles_err, roles_row) {
                if(roles_err)
                    console.log("Error! Can't find roles!");
                else
                {
                    getSingleCategory(category_id, db, function(categories_err, categories_row) {
                        let user_role = 'none';
                        let category_type = -1; // public for now
                        if(categories_err)
                            console.log("Error! Can't find categories!");
                        else
                        {
                            //category_id, user_id, post_id reply_id, cb
                            checkOwnership(category_id, user_id, post_id, reply_id, db, function(condition) {
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
                                else if (roles_row.role == 2) //if moderator, then must own the category with category_id
                                    user_role = 'moderator';
                                if(categories_row == null)
                                    console.log("category doesn't exist");
                                else
                                    category_type = categories_row.public;

                                //check if the user owns the post/reply they are trying to edit/delete
                                if((operation === 'delete') && (element === 'post' || element === 'reply'))
                                {
                                    if(!condition && user_role !== 'admin')
                                    {
                                        //console.log(condition);
                                        let acg = false;
                                        cb(user_id, category_id, operation, element, acg);
                                        return;
                                    }
                                    //if inside here, return false, aka make cb false
                                } // when execution goes beyond this if statement

                                                                //check if the user owns the post/reply they are trying to edit/delete
                                if((operation === 'update') && (element === 'post' || element === 'reply' ))
                                {
                                    if(!condition)
                                    {
                                        //console.log(condition);
                                        let acg = false;
                                        cb(user_id, category_id, operation, element, acg);
                                        return;
                                    }
                                    //if inside here, return false, aka make cb false
                                } // when execution goes beyond this if statement
                                else if(operation === 'update' && element === 'category' && roles_row != null) // special case when admin owns a category a and wants to edit.
                                {                                                           // only the moderator of a category can change it !!!!
                                    if(roles_row.role === 2)
                                        user_role = 'moderator';
                                }


                                //at this point no need to check ownership, post/reply figured out and the category
                                // ownership is figured out in hasAccess
                                //operation, element, user_role, post_id, reply_id, category_type
                                let accessGranted = hasAccess(operation, element, user_role, post_id, reply_id, category_type);
                                //console.log(accessGranted, "Bate Boiko");
                                cb(user_id, category_id, operation, element, accessGranted);
                            });
                        }
                    });
                }
            });
        }
    });
}
// //checkAccess(user_id, category_id, operation, element, cb)
// checkAccess(5,2,'read','reply', function(accessGranted) {
//     console.log("Access allowed: ", accessGranted);
// });



//usr id (GLOBAL), userInfo(db), categoryInfo(db), 
//FINAL USER ROLES: guest, user, moderator, admin
function hasAccess(operation, element, user_role, post_id, reply_id, category_type)
{
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
            if(user_role === 'member')
                user_role = 'user'
            const permission = ac.can(user_role).createOwn('category');
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
            if(user_role === 'member' || user_role === 'admin')
                return false; // only if moderator or admin(who owns a category)
            //findRole, checks the users role in the category
            const permission = ac.can(user_role).updateOwn('category'); // if moderator then update own
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
                //if admin or moderator check Any, else check Own(ownership is figured out in checkAccess)
                // the ownership of the category for a moderator is figured out in checkAccess
                if(reply_id === -1 && element === 'post')
                {
                    const permission = ac.can(user_role).updateOwn('post');
                    console.log("zashto taka1?", user_role, element, permission.granted);
                    return permission.granted;
                }
                else if(reply_id !== -1 && element === 'reply')
                {
                    const permission = ac.can(user_role).updateOwn('reply');
                    console.log("zashto taka?", user_role, element, permission.granted);
                    return permission.granted;
                }
                return false;
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
                //if admin or moderator check Any, else check Own(ownership is figured out in checkAccess)
                // the ownership of the category for a moderator is figured out in checkAccess
                console.log(reply_id, "reply_id");
                if(reply_id === -1 && element === 'post')
                {
                    const permission = (user_role === 'admin' || user_role === 'moderator')
                        ?ac.can(user_role).deleteAny('post')
                        :ac.can(user_role).deleteOwn('post');
                    return permission.granted;
                }
                else if (reply_id !== -1 && element === 'reply')
                {
                    const permission = (user_role === 'admin' || user_role === 'moderator')
                        ?ac.can(user_role).deleteAny('reply')
                        :ac.can(user_role).deleteOwn('reply');
                    return permission.granted;
                }
                else
                    return false;

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
    let i = 0;
    for(i; i < roles.length; i++)
    {
        let j = 0;
        for(j; j < operations.length; j++)
        {
            let k = 0;
            for(k; k < elements.length; k++)
            {
                //hasAccess(operation, element, user_role, type)
                let tempp = hasAccess(operations[j], elements[k], roles[i], 0);
                console.log(roles[i], operations[j], elements[k], tempp);
            }
        }
    }
}

//testAC();

// ===============================================================================