const AccessControl     = require('accesscontrol');
//DEFINING THE ACCESS CONTROL BASIC STRUCTURE, WITHOUT PRIVATE, private is checked later
//the list of orders could be defined inside a data base as an array, and we can only read it in
// can be found on the last example https://www.npmjs.com/package/accesscontrol#expressjs-example
const ac = new AccessControl();
ac.grant('user')                
        .createOwn('post')
        .updateOwn('post')
        .deleteOwn('post')
        .createOwn('reply')
        .updateOwn('reply')
        .deleteOwn('reply')
        .createOwn('category')
    .grant('moderator')
        .extend('user')
        .deleteAny('post')
        .deleteAny('reply')
        .deleteOwn('category')                    // need to move to owner b/c only owner can delete
    .grant('owner')
        .extend('moderator')
        .updateOwn('category')
    .grant('admin')
        .extend('moderator')
        .deleteAny('category');
ac.deny('admin').deleteAny('category');
// ONLY THE OWNER OF A PPOST, REPLY OR CATEGORY CAN EDIT THEM!!!
// MODERATORS CAN DELETE ANY POST, REPLY OR UPDATE OWN CATEGORY. 
// ADMIN CAN DELETE ANY POST, REPLY OR CATEGORY
// ADMIN CAN NOT UPDATE POSTS CATEGORIES OR REPLIES THAT HE DOESN'T OWN        

/*This is a function that reads a spesific elements from the tables inside the 
    data base in order to get the needed data for the Access Control checks! */
function getSingleElement(element, user_id, category_id, post_id, reply_id, db, cb) {
    let sqlquery = '';
    switch(element) {
        case 'category':
            sqlquery = 'SELECT category_id, public FROM categories WHERE category_id=' + category_id;
            break;
        case 'role':
            sqlquery = "SELECT * FROM roles WHERE user_id=" + user_id+" AND category_id="+category_id;
            break;
        case 'post':
            sqlquery = "SELECT category_id, post_id, user_id  FROM posts WHERE category_id=" + category_id + " AND post_id=" + post_id + " AND user_id=" + user_id;
            break;
        case 'reply':
            sqlquery = "SELECT category_id, post_id, reply_id, user_id FROM replies WHERE category_id=" + category_id + " AND post_id=" + post_id + " AND user_id=" + user_id + " AND reply_id=" + reply_id;
            break;
        case 'user':
            sqlquery = "SELECT id, username, role FROM users WHERE id=" + user_id;
            break;
    }
    db.all(sqlquery, function(err, rows) {
        if(err) { cb(err,null); }
        else if(rows.length < 1) {
            cb(null,null);
        }else {
            cb(null,rows[0]);
        }
    });
}


/* This function checks for ownership in case when an update or delete operationis
    are requested for a post or reply.*/
function checkOwnership(element, category_id, user_id, post_id, reply_id, db, cb) {
    if(element === 'post' || element === 'reply') {
        getSingleElement(element, user_id, category_id, post_id, reply_id, db, function(err, row) {
            if(err)
                console.log("Error! Can't find " + element + "!");
            else {
                if(row == null)
                    cb(false);
                else
                    cb(true);
            }
        });
        return;
    }
    cb(false); // false by default
}


/* Once we have the role of the user and the ownership check for categories, 
    posts and replies is established we go onto the next step, which is the access check.
    This function checks the access of the user based on the role and operation.*/
function hasAccess(operation, element, user_role, post_id, reply_id, category_type) {
    if(operation === 'read') {
        if (category_type === 1) //if public
            return true;
        else if(category_type === 0) {
            if(user_role === 'guest' || user_role === 'user') 
                return false;
            else // if member, moderator or admin
                return true;
        }
    }
    else if(operation === 'create') {
        if (user_role === 'guest')
            return false;
        if (element === 'category') {
            if(user_role === 'member')
                user_role = 'user'
            const permission = ac.can(user_role).createOwn('category');
            return permission.granted;
        }
        else { // element is either a post or a reply
            if (category_type === 1) // if public
                return true; //user,member,moderator and admin can create posts,replies
            else if(category_type === 0) {
                if(user_role === 'user') 
                    return false;
                else // member, moderator, admin (all can create posts and replies)
                    return true;
            }
        }
    }
    //updates can only be made by the person owning the element
    else if(operation === 'update')
    {
        if(user_role === 'guest')
            return false;
        if(element === 'category') { 
            if(user_role === 'admin')
                return false; // if the user role is admin, it means that they are not owner
            const permission = ac.can(user_role).updateOwn('category'); // if owner then update category
            return permission.granted;
        }
        else { // element is post or reply
            if (category_type === 0 && user_role === 'user')
                return false;
            else {
                if(user_role === 'member')
                    user_role = 'user';
                //if moderator check Any, else check Own(ownership is figured out in checkAccess)
                // the ownership of the category for a moderator is figured out in checkAccess
                if(reply_id === -1 && element === 'post') {
                    const permission = ac.can(user_role).updateOwn('post');
                    return permission.granted;
                }
                else if(reply_id !== -1 && element === 'reply') {
                    const permission = ac.can(user_role).updateOwn('reply');
                    return permission.granted;
                }
                return false;
            }
        }
    }
    else if(operation === 'delete') {
        if(user_role === 'guest')
            return false;
        if(element === 'category') { 
            if(user_role === 'member')
                user_role = 'user';
            const permission = (user_role === 'owner')
                   ? ac.can(user_role).deleteOwn('category')   // if owner then delete own
                   : ac.can(user_role).deleteAny('category');    // if admin can delete any
            return permission.granted;
        }
        else { // element is either a post or a reply
            if (category_type === 0 && user_role === 'user')
                return false;
            else {
                if(user_role === 'member')
                    user_role = 'user';
                //if admin or moderator check Any, else check Own(ownership is figured out in checkAccess)
                // the ownership of the category for a moderator is figured out in checkAccess
                if(reply_id === -1 && element === 'post') {
                    const permission = (user_role === 'admin' || user_role === 'moderator' || user_role === 'owner')
                        ?ac.can(user_role).deleteAny('post')
                        :ac.can(user_role).deleteOwn('post');
                    return permission.granted;
                }
                else if (reply_id !== -1 && element === 'reply') {
                    const permission = (user_role === 'admin' || user_role === 'moderator' || user_role === 'owner')
                        ?ac.can(user_role).deleteAny('reply')
                        :ac.can(user_role).deleteOwn('reply');
                    return permission.granted;
                }
                return false;
            }
        }
    }
    return false; // by default 
}


/* This function puts everything needed to establish the permision for an operation 
    on a spesific element, based on the users role and ownership. 
    1. Find the usre role.
    2. Establish ownership.
    3. deal with special cases.
    4. Check if the user has access to complete the operation on the spesific element.*/
exports.checkAccess = function(user_id, category_id, post_id, reply_id, operation, element, db, cb) {
    getSingleElement('user', user_id, category_id, post_id, reply_id, db, function(users_err, users_row) {
        if(users_err)
            console.log("Error! Can't find users!");
        else {
            getSingleElement('role', user_id, category_id, post_id, reply_id, db, function(roles_err, roles_row) {
                if(roles_err)
                    console.log("Error! Can't find roles!");
                else {
                    getSingleElement('category', user_id, category_id, post_id, reply_id, db, function(categories_err, categories_row) {
                        let user_role = 'none';
                        let category_type = -1; // -1 by default
                        if(categories_err)
                            console.log("Error! Can't find categories!");
                        else {
                            checkOwnership(element, category_id, user_id, post_id, reply_id, db, function(condition) {
                                if(users_row == null)
                                    user_role = 'guest';
                                else if(users_row.role === 1)
                                    user_role = 'admin';
                                else if(roles_row == null)
                                    user_role = 'user';
                                else if (roles_row.role === 1) // 1 owner, 2 moderator, 3 memeber
                                    user_role = 'owner';
                                else if (roles_row.role === 2) //if moderator, then must own the category with category_id
                                    user_role = 'moderator';
                                else if(roles_row.role === 3)
                                    user_role = 'member'
                                if(categories_row != null)
                                    category_type = categories_row.public;
                                 // if category doesn't exist the only operation allowed is create new category!
                                else if(operation !== 'create' && element !== 'category')
                                {
                                    console.log("category doesn't exist");
                                    return false;
                                }
                                //check if the user owns the post/reply they are trying to edit/delete
                                if((operation === 'update' || operation === 'delete') && (element === 'post' || element === 'reply')) {
                                    if(!condition && user_role !== 'admin' && operation === 'delete') {
                                        cb(user_id, category_id, operation, element, false);
                                        return;
                                    }
                                    if(!condition && operation === 'update') {
                                        cb(user_id, category_id, operation, element, false);
                                        return;
                                    }
                                    //if inside here, return false, aka make cb false
                                } // when execution goes beyond this if statement

                                // special case when admin owns a category and wants to edit.
                                // only the owner of a category can change it !!!
                                if(operation === 'update' && element === 'category' && roles_row != null && roles_row.role === 2) 
                                    user_role = 'owner';  
                                //at this point no need to check ownership, post/reply figured out and the category
                                // ownership is figured out in hasAccess
                                //operation, element, user_role, post_id, reply_id, category_type
                                let accessGranted = hasAccess(operation, element, user_role, post_id, reply_id, category_type);
                                cb(user_id, category_id, operation, element, accessGranted);
                            });
                        }
                    });
                }
            });
        }
    });
}