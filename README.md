# ECS 153 Final Project
Jonathan Hsu, Patrick Liao, Zaprin Ignatiev  
6/12/2019


## Basic structure of our code
Our code is comprised of these parts: 
- Frontend in `/public`
	- Forum: `index.html`, `script.js`
	- Login/Signup: `login.html`, `signup.html`, `users_client.js` 
- Backend in `app.js`, `accesscontrol.js`, `users.js`
	- Forum Functionality
		- CRUD for Categories, Posts, Replies, Settings
	- Access Control
	    - Authentication
		    - Sessions, login/logout
		- Authorization
		    - Check priviliges of user, eg. can: read, write, edit 

## Security concepts from our project
Web security concepts we explored:
**`Authentication`, `Authoriation (Access Control)`, `Error Handling`, `Input Validation`, `Password Management`, `Session Management`, `SQL Injection`, `XSS`, `Brute Force/DDoS`, `CORS/SOP`**

### Forum Functionality
**Concepts: `Input Validation`, `Error Handling`, `CORS/SOP`, `Brute Force/DDoS`**  
We implemented Create, Read, Update and Delete [HTTP methods](https://www.restapitutorial.com/lessons/httpmethods.html) for Categories, Posts, Replies and Settings. These requests are sent from the client in `script.js` and are handled by the server in `app.js`. The SOP is enforced by default as we do not allow cross-origin access. We have basic input validation (check if empty, check if boolean) for request queries and we pass the appropriate [HTTP status code](https://www.restapitutorial.com/httpstatuscodes.html) for invalid requests. 

We used [`express-rate-limiter`](https://www.npmjs.com/package/express-rate-limit) to implement a basic rate limiter to protect against any DDoS or brute force attacks. The rate limiter blocks a client after too many repeated requests and applies to all requests (authentication/authorization, CRUD). 


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
For our project we implemented Hierarchical Role Based Access Control (HRBAC), along with Discretionary Resource Based Access Control. We used Role-Based AC to apply policies to groups (admin/user/guest) and used Discretionary Resource-Based AC to establish and change ownership/policies (owner/moderator/user) of resources (categories/posts/replies). 

Through this sytem, users can create private categories, add other users to categories, admins have elevated privelges, authors can delete/edit their own content, and more. 

In HRBAC, user roles extend each other. For example, guest can read public categories and user extends guest so user can read public categories as well. Moderator extends user, so a moderator can do everything both user and guest can do, and so on. This is why the first thing we set up inside `accesscontrol.js` is the HRBAC structure `"ac"`. 
We used a library called [`accesscontrol`](https://www.npmjs.com/package/accesscontrol), which helps us set the user roles: 
`ac.grant('moderator')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`.extend('user')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`.deleteAny('post')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`.deleteAny('reply')`   
It also provides a function that checks access based on user roles and the action each role can do over a spesific atribute:

`const permission = (user_role === 'owner')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`? ac.can(user_role).deleteOwn('category')`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`: ac.can(user_role).deleteAny('category');`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `return permission.granted;`   

In this example `persmision.granted` will be true only if the user is owner so the user can delete any category that he created or if user role is admin then he can delete any category.   

**Access Control implementation steps**:  
1. Check **user** against **users table**  
    In `checkAccess()`, we check if the user exists and if the user is an admin. If the user doesn't exist they are a guest. 
2. Check **ownership/membership** against **resource**.  
    In `checkAccess()`, we call `checkOwnership()` which compares the user to the resource owner in the database, determines if the user can modify the resource. 
3. Check **operation** against **role**.  
    In `checkAccess()`, if `checkOwnership()` is successful, we call `hasAccess()` to determine which operations the role can perform and which resources the role can view.  
4. Error handling, input validation and granting access  
    If there are no errors and the input is valid, `checkAccess()` grants access for the requested operation. Otherwise, access is not granted.
    

### Future Work
In the future, we could explore:
- CSRF through [`csurf`](https://www.npmjs.com/package/csurf)
- [HTTPS](https://nodejs.org/api/https.html)
- Additional [authentication strategies](http://www.passportjs.org/packages/)
- Request-specific rate limiting