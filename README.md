# ECS 153 Final Project
Jonathan Hsu, Patrick Liao, Zaprin Ignatiev  
6/12/2019


## Basic structure of our code
Our code is comprised of these parts: 
- Frontend in `/public`
	- Forum: `index.html`, `script.js`
	- Login/Signup: `login.html`, `signup.html`, `users_client.js` 
- Backend/Server in `app.js`, `accesscontrol.js`, `users.js`
	- Forum Functionality
		- CRUD for Categories, Posts, Replies, Settings
	- Access Control
	    - Authentication
		    - Sessions, login/logout
		- Authorization
		    - Check priviliges of user, eg. can: read, write, edit 

## Security concepts from our project
Web security concepts we explored:
**`Authentication`, `Authorization (Access Control)`, `Error Handling`, `Input Validation`, `Password Management`, `Session Management`, `SQL Injection`, `XSS`, `Brute Force/DDoS`, `CORS/SOP`**

### Forum Functionality
**Concepts: `Input Validation`, `Error Handling`, `CORS/SOP`, `Brute Force/DDoS`, `XSS`**  
We implemented Create, Read, Update and Delete [HTTP methods](https://www.restapitutorial.com/lessons/httpmethods.html) for Categories, Posts, Replies and Settings. These requests are sent from the client in `script.js` and are handled by the server in `app.js`. The Same Origin Policy (SOP) is enforced by default as we do not allow cross-origin access. We have basic input validation (check if empty, check if boolean) for request queries and we pass the appropriate [HTTP status code](https://www.restapitutorial.com/httpstatuscodes.html) for invalid requests. 

We used [`express-rate-limiter`](https://www.npmjs.com/package/express-rate-limit) to implement a basic rate limiter to protect against any DDoS or brute force attacks. The rate limiter blocks a client after too many repeated requests and applies to all requests (authentication/authorization, CRUD). 

We address Cross-Site Scripting (XSS) in [several](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.md) [ways](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.md). First, we safely populate the DOM by using safe javascript properties, like `textContent`. We also build our DOM through safe javascript functions like `document.createElement()`, `element.setAttribute()` and `element.appendChild()`. We avoid putting untrusted data into our HTML, as all of our data comes from our server. We use `JSON.parse()` instead of `eval()` to convert JSON, and we use the HTTPOnly cookie flag. These measures are just some of the many ways we can address/prevent XSS. In the future, using a modern frontend framework like ReactJS would be better for XSS prevention and for rendering our app. 


### Database
**Concepts: `SQL Injection`**  
We used a [`sqlite3`](https://www.npmjs.com/package/sqlite3) database for portability. We prevent SQL injection by sanitizing input with the [`sqlstring`](https://www.npmjs.com/package/sqlstring) package and through [prepared statements](https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback).


### Authentication
**Concepts: `Authentication`, `Password Management`,`Input Validation`, `Session Management`, `XSS`**  
#### Server Side
Server side authentication code is in the ```app.js``` file. Our forum app supports login, signup, and logout.

For sign up, there is a handler that is triggered when the user makes a POST request for ```/signup```. This will trigger the ```create_user``` function, which will take the username and password in the request query's parameters and send a SQL query to the database. The password is hashed with [`bcrypt`](https://www.npmjs.com/package/bcrypt) so that passwords can't be read even with access to the database. If there are no errors, a new entry will be added to the users table.

We used the [`passport.js`](http://www.passportjs.org/) middleware to help with handling some authentication logic. Passport.js allows for many different strategies for user login and signup. For our forum app, we used the "basic strategy", which is username and password matching for login. 

In our code, we wrote the function handler that queries the database to check the username and password. The password is checked using [`bcrypt`](https://www.npmjs.com/package/bcrypt) and if it matches, the passport and session middleware will create a persistent login session and cookie.

We used [`express-session`](https://www.npmjs.com/package/express-session) to handle server-side sessions and manage cookies. We provide the passport middleware with the user id, so that it can serialize the user id and include the result inside the cookie. This cookie is given to the client so that subsequent requests can be deserialized and verified using the cookie instead of username/password matching. We implemented as many [best practices for cookie security](https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely) as we could for our local/dev environment, which helps protect against XSS attacks (httpOnly, maxAge). Other cookie options can be enabled in a non-local environment (secure HTTPS, domain/path). 

#### Client Side
On the client side, we have a front-end interface for users to enter their username and password information, located in ```login.html``` and ```signup.html``` respectively. Requests are sent in ```users_client.js``` , and we have client-side input validation and error messages when invalid credentials are used (in addition to server-side). 

### Authorization
**Concepts: `Authorization (Access Control)`, `Error Handling`, `Input Validation`**  
For our project we implemented Hierarchical Role Based Access Control (HRBAC), along with Discretionary Resource-Based Access Control (DRBAC). We used HRBAC to apply policies to groups (admin/user/guest) and used DRBAC to establish and change ownership/policies (owner/moderator/user) of resources (categories/posts/replies). 

Through this sytem, users can create private categories, add other users to categories, admins have elevated privelges, authors can delete/edit their own content, and more. 

These are parameters/properties (roles, operations, resources) of the access control system we defined:
- HRBAC Roles: `guest`, `user`, `admin`
- DRBAC Roles: 
    - For Categories: `owner`, `moderator`, `member`
    - For Posts/Replies: `owner`
- Operations: `create`, `read`, `update`, `delete`
- Resources: `category`, `post`, `reply`

In HRBAC, user roles extend each other. For example, guest can read public categories and user extends guest so user can read public categories as well. Moderator extends user, so a moderator can do everything both user and guest can do, and so on.  

We set up our HRBAC structure inside `accesscontrol.js` using the [`accesscontrol`](https://www.npmjs.com/package/accesscontrol) package. We see through the code below that `moderator` inherits from `user` but can also perform additional operations:  

`ac.grant('moderator')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`.extend('user')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`.deleteAny('post')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`.deleteAny('reply')`   

We can check access based on the user's role, the requested operation and the resource ownership:

`const permission = (user_role === 'owner')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`? ac.can(user_role).deleteOwn('category')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`: ac.can(user_role).deleteAny('category');`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `return permission.granted;`   

In the code above, permission is granted for the owner to delete any category they own.   

**Access Control implementation steps**:  
1. Check **user** against **users table**.  
    In `checkAccess()`, we check if the user exists and if the user is an admin. If the user doesn't exist they are a guest. 
2. Check **ownership/membership** against **resource**.  
    In `checkAccess()`, we call `checkOwnership()` which compares the user to the resource owner in the database, determines if the user can modify the resource. 
3. Check **operation** against **role**.  
    In `checkAccess()`, if `checkOwnership()` is successful, we call `hasAccess()` to determine which operations the role can perform and which resources the role can view.  
4. Error handling, input validation and granting access.  
    If there are no errors and the input is valid, `checkAccess()` grants access for the requested operation. Otherwise, access is not granted.
    

### Future Work
In the future, we could explore:
- CSRF through [`csurf`](https://www.npmjs.com/package/csurf)
- [HTTPS](https://nodejs.org/api/https.html)
- Additional [authentication strategies](http://www.passportjs.org/packages/)
- Request-specific rate limiting
- Use a frontend library like React