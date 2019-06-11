// auto-height textarea
// from https://stackoverflow.com/a/25621277
var tx = document.getElementsByTagName('textarea');
for (var i = 0; i < tx.length; i++) {
  tx[i].setAttribute('style', 'height:' + (tx[i].scrollHeight) + 'px;overflow-y:hidden;');
  tx[i].addEventListener("input", OnInput, false);
}

function OnInput() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
}

function createElement( str ) {
	// https://stackoverflow.com/questions/3662821/how-to-correctly-use-innerhtml-to-create-an-element-with-possible-children-fro
    var frag = document.createDocumentFragment();

    var elem = document.createElement('div');
    elem.innerHTML = str;

    while (elem.childNodes[0]) {
        frag.appendChild(elem.childNodes[0]);
    }
    return frag;
}

function createCORSRequest(method, url) {
	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);  // call its open method
	return xhr;
}

function newarticle_editor() {
	// check if there's already an editor
	if(document.getElementById("main_articleeditor")) {
		return;
	}
	// reset active articles
	let activepost = document.getElementsByClassName("main_article_active");
	for (let i = 0; i < activepost.length; i++) {
		activepost[i].className = "main_article";
	}

	let main_articles = document.getElementById("main_articles")
	let main_articlecreator_htmlstring = `
	<div class="main_article main_article_active" id="main_articleeditor">
		<div class="main_article_left"><i class="material-icons main_article_icon">edit</i></div>
		<div class="main_article_right">
			<span class="main_article_title">New Article Draft</span><br>
			<span class="main_article_author">By `+global_userprofile["username"]+`</span>
		</div>
	</div>`;
	let main_articlecreator = createElement(main_articlecreator_htmlstring);
	main_articles.prepend(main_articlecreator);

	let article = document.getElementById("article");
	article.innerHTML = `
	<input type="text" class="new_post_title" id="new_post_title" name="new_title" placeholder="New Post Title">
	<textarea class="new_post_content" id="new_post_content" name="new_content" placeholder="Write something.."></textarea>
	<input type="submit" class="new_post_button" id="new_post_button" value="Create Post" onclick="createpost();">
	`;
	// let main_articlecreator = createElement(main_articlecreator_htmlstring);
	// article.prepend(main_articlecreator);

	// <input type="text" id="new_post_title" name="new_title" placeholder="New Post Title">
	// <textarea id="new_post_content" name="new_content" placeholder="Write something.." style="height:98px;overflow-y:hidden;"></textarea>
}

function toggle_usersettings() {

}

function toggle_categorysettings(categoryid) {
	main = document.getElementById("main");
	main_settings = document.getElementById("main_settings");
	if (main.classList.toggle("main_large")) {
		// main_large
		main_settings.classList.toggle("main_settings_large");
	}
	else {
		// main_small
		main_settings.classList.toggle("main_settings_large");
		
	}
	// document.getElementById("main").style.flex = "100";
}
function hide_categorysettings(categoryid) {
	main = document.getElementById("main");
	if(main.classList.contains("main_large")) {
		toggle_categorysettings(1);
	}
}
function get_categorysettings(categoryid) {

}

// AUTHORS

function getuserprofile(cb) {
	let url = "/getuserprofile";
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		console.log(xhr.responseText);
		if(xhr.status == 401){//xhr.responseText == "") {
			cb(null);
		}
		else {
			cb(JSON.parse(xhr.responseText));
		}
	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

let globalfoundauthornames = {};

function getauthornames() {
	let authors = document.getElementsByClassName("author");
	for (let i = 0; i < authors.length; i++) {
		let currentauthorid = authors[i].getAttribute('data-authorname');
		if (globalfoundauthornames.hasOwnProperty(currentauthorid)) {
			authors[i].textContent = globalfoundauthornames[currentauthorid];
		}
		else {
			getauthorname(currentauthorid, function(authorname) {
				globalfoundauthornames[currentauthorid] = authorname;
				authors[i].textContent = authorname;
			});
		}
	}
}

function getauthorname(userid, cb) {
	let url = "/getauthor?userid=" + userid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		// console.log(xhr.responseText)
		if(xhr.responseText == "") {
			cb(null);
		}
		else {
			cb(JSON.parse(xhr.responseText).username);
		}
	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

// END AUTHORS

// BASIC FUNCTIONALITY

function getcategories(categoryid) {
	// show create category
	if (global_userprofile != null) {
		document.getElementById("nav_create").classList.remove("hidden");
	}

	let url = "/getcategorynames";
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object

		global_categorypermissions = object;

		let nav_links = document.getElementById("nav_links");
		nav_links.innerHTML = "";

		hide_categorysettings(0);

		for (let i = 0; i < object.length; i++) {
			let activecategoryclass = "";
			if (categoryid == "default" && i == 0) {
				activecategoryclass = "nav_link_active";
				currentcategory = object[i].category_id;
				let main_title = document.getElementById("main_title");
				main_title.textContent = object[i].title;

				// accesscontrol: category settings
				if (global_userprofile != null && (
					global_userprofile["owned_categories"].includes(object[i].category_id) ||
					global_userprofile["moderator_categories"].includes(object[i].category_id) ||
					// global_userprofile["user_categories"].includes(object[i].category_id) ||
					global_userprofile["role"] == 1)) {
					let category_settings = createElement(`<i class="material-icons category_settings" onclick="toggle_categorysettings(`+object[i].category_id+`);">settings</i>`);
					main_title.appendChild(category_settings);

					// get visibility
					updatecategorysettings(object[i].category_id, object[i].public);
				}

				// accesscontrol: create post button
				if (global_userprofile != null) {
					document.getElementById("main_newbutton").classList.remove("hidden");
				}
			}
			else if (categoryid == object[i].category_id) {
				activecategoryclass = "nav_link_active";
				currentcategory = object[i].category_id;
				let main_title = document.getElementById("main_title");
				main_title.textContent = object[i].title;
				// accesscontrol: category settings
				if (global_userprofile != null && (
					global_userprofile["owned_categories"].includes(object[i].category_id) ||
					global_userprofile["moderator_categories"].includes(object[i].category_id) ||
					// global_userprofile["user_categories"].includes(object[i].category_id) ||
					global_userprofile["role"] == 1)) {
					let category_settings = createElement(`<i class="material-icons category_settings" onclick="toggle_categorysettings(`+object[i].category_id+`);">settings</i>`);
					main_title.appendChild(category_settings);

					// get visibility
					updatecategorysettings(object[i].category_id, object[i].public);
				}

				// accesscontrol: create post button
				if (global_userprofile != null) {
					document.getElementById("main_newbutton").classList.remove("hidden");
				}
			}
			// accesscontrol: category deleteable?
			let candelete = "hidden"; // cannot delete
			if (global_userprofile != null && (
				global_userprofile["owned_categories"].includes(object[i].category_id) ||
				// global_userprofile["moderator_categories"].includes(object[i].category_id) ||
				// global_userprofile["user_categories"].includes(object[i].category_id) ||
				global_userprofile["role"] == 1)) {
				candelete = ""; // can delete
			}
			let newcategory_htmlstring = `
			<div class="nav_link `+activecategoryclass+`" id="category_`+object[i].category_id+`">
				<i class="material-icons nav_delete `+candelete+`" onclick="deletecategory(`+object[i].category_id+`);" id="category_delete_`+object[i].category_id+`">close</i>
				<span class="nav_link_text" onclick="switchcategory(`+object[i].category_id+`);" id="category_title_`+object[i].category_id+`">
					`+object[i].title+`<!--<br>? Posts-->
				</span>
			</div>`;
			let newcategory = createElement(newcategory_htmlstring);

			

			nav_links.appendChild(newcategory);

// object[i].category_id, object[i].title.slice(1, -1), object[i].public 
		}

		

		getposts(currentcategory, "default");

		console.log("categories:", object);
	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function updatecategorysettings(categoryid, public) {
	if(public == 1) {
		document.getElementById('visibility_1').checked = true;
	}
	else {
		document.getElementById('visibility_0').checked = true;
	}
	let updatevisibility = document.getElementById('updatevisibility');
	updatevisibility.setAttribute( "onClick", "updatevisibility("+categoryid+")" );

	// get users
	getcategoryusers(categoryid);
}

function switchcategory(categoryid) {
	// let activecategory = document.getElementsByClassName("nav_link_active");
	// for (let i = 0; i < activecategory.length; i++) {
	// 	activecategory[i].className = "nav_link";
	// }
	// let activecategory = document.getElementById("category_" + categoryid);
	// activecategory.className += "nav_link_active";

	// simple method?
	getcategories(categoryid);

}


function createcategory() {
	let newname = document.getElementById("nav_create_input");
	let public = "1";

	let url = "/newcategory?categoryname=" + newname.value + "&public=" + public;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) {throw new Error('CORS not supported');}
	// xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let status = xhr.status; 
		console.log(responseStr, status);
		// window.location.reload(false); 
		newname.value = "";

		// get permission for new category
		getuserprofile(function(userprofile) {
			global_userprofile = userprofile;
			getcategories("default");
		});
		getcategories(currentcategory);
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};

	xhr.send();
}

function deletecategory(categoryid) {
	let url = "/deletecategory?categoryid=" + categoryid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		console.log(xhr.responseText, xhr.status);
		if(categoryid == currentcategory) {
			currentcategory = "default";
		}
		getcategories(currentcategory);
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};
	xhr.send();
}

function getcategoryusers(categoryid) {
	let url = "/getcategoryusers?categoryid=" + categoryid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) {throw new Error('CORS not supported');}
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object
		console.log("users:", object);

		let userstable = document.getElementById('userstable');
		userstablestring = `
		<table id="userstable">
		<tr><th>Username</th>
			<th>Type</th>
			<th>Manage</th></tr>`;

		// show users
		for(let i = 0; i < object.length; i++) {
			if(object[i].role == 1) { // owner
				userstablestring += `
				<tr>
				    <td>`+object[i].username+`</td>
				    <td>
				    	Owner
					</td>
				    <td></td>
				 </tr>`;
				// userrow_temp = createElement(userrow_temp_htmlstring);
				// userstable.appendChild(userrow_temp);

				// let userrow_owner = document.getElementById('userrow_owner');
				// userrow_owner.childNodes[1].textContent = object[i].username;
				// userrow_owner.childNodes[3].textContent = "Owner";
			}
			else if(object[i].role == 2) { // moderator
				userstablestring += `
				<tr>
				    <td>`+object[i].username+`</td>
				    <td>
				    	<select onchange="updateuser(`+categoryid+`,`+object[i].user_id+`)" id="userrole_`+object[i].user_id+`">
						  <option value="2" selected="selected">Moderator</option>
						  <option value="3">User</option>
						</select>
					</td>
				    <td><input type="button" value="Remove User" onclick="removeuser(`+categoryid+`,`+object[i].user_id+`)"></td>
				 </tr>`;
				// userrow_temp = createElement(userrow_temp_htmlstring);
				// userstable.appendChild(userrow_temp);
			}
			else if(object[i].role == 3) { // user
				userstablestring += `
				<tr>
				    <td>`+object[i].username+`</td>
				    <td>
				    	<select onchange="updateuser(`+categoryid+`,`+object[i].user_id+`)" id="userrole_`+object[i].user_id+`">
						  <option value="2">Moderator</option>
						  <option value="3" selected="selected">User</option>
						</select>
					</td>
				    <td><input type="button" value="Remove User" onclick="removeuser(`+categoryid+`,`+object[i].user_id+`)"></td>
				 </tr>`;
				// userrow_temp = createElement(userrow_temp_htmlstring);
				// userstable.appendChild(userrow_temp);
			}
		}
		userstable.innerHTML = userstablestring + "</table>";

		let userrow_add = document.getElementById('userrow_add');
	};
	xhr.onerror = function() { alert('error'); };
	xhr.send();
}
function updateuser(categoryid, userid) {
	let userrole = document.getElementById("userrole_" + userid).value;
	let url = "/updateuser?categoryid=" + categoryid + "&userid=" + userid + "&role=" + userrole;
	
	let xhr = createCORSRequest('GET', url);
	if (!xhr) {throw new Error('CORS not supported');}
	xhr.onload = function() {
		console.log("updated user");
		getcategoryusers(currentcategory);
	};
	xhr.onerror = function() { alert('error'); };
	xhr.send();
}
function removeuser(categoryid, userid) {
	let url = "/removeuser?categoryid=" + categoryid + "&userid=" + userid;

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {throw new Error('CORS not supported');}
	xhr.onload = function() {
		console.log("removed user");
		getcategoryusers(currentcategory);
	};
	xhr.onerror = function() { alert('error'); };
	xhr.send();
}
function adduser() {
	let userrole = document.getElementById("newuserrole").value;
	let username = document.getElementById("newusername").value;
	let url = "/adduser?categoryid=" + currentcategory + "&username=" + username + "&role=" + userrole;

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {throw new Error('CORS not supported');}
	xhr.onload = function() {
		console.log("added user");
		document.getElementById("newuserrole").value = 3;
		document.getElementById("newusername").value = "";
		getcategoryusers(currentcategory);
	};
	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function getposts(categoryid, postid) {
	let url = "/getcategoryposts?categoryid=" + categoryid;

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {throw new Error('CORS not supported');}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object
		console.log("posts:", object);

		let main_articles = document.getElementById("main_articles");
		main_articles.innerHTML = "";
		document.getElementById("article").innerHTML = "";

		if(object.length == 0) {
			main_articles.innerHTML = "No Posts";
			document.getElementById("article").innerHTML = "";
		}

		// for (let i = 0; i < object.length; i++) {
		for (let i = object.length-1; i >= 0; i--) {

			let activepostclass = "";
			let workingpostid = object[i].category_id + "_" + object[i].post_id;
			if (postid == "default" && i == object.length-1) {
				activepostclass = "main_article_active";
				currentpost = object[i].post_id;
				getpost(object[i].category_id, object[i].post_id);
				// document.getElementById("main_title").textContent = object[i].title.slice(1, -1);
			}
			// else if (currentpost == workingpostid) {
			else if (postid == object[i].post_id) {
				activepostclass = "main_article_active";
				currentpost = object[i].post_id;
				getpost(object[i].category_id, object[i].post_id);
				// document.getElementById("main_title").textContent = object[i].title.slice(1, -1);
			}

			// accesscontrol: post deleteable?
			let candelete = "hidden"; // cannot delete
			if (global_userprofile != null && (
				global_userprofile["owned_categories"].includes(object[i].category_id) ||
				global_userprofile["moderator_categories"].includes(object[i].category_id) ||
				global_userprofile["id"] == object[i].user_id ||
				global_userprofile["role"] == 1)) {
				candelete = ""; // can delete
			}

			let newpost_htmlstring = `
			<div class="main_article `+activepostclass+`" id="post_`+workingpostid+`">
				<div class="main_article_left"><i class="material-icons main_article_icon">account_circle</i></div>
				<div class="main_article_right" onclick="switchpost(`+object[i].category_id+`,`+object[i].post_id+`);">
					<span class="main_article_title">`+object[i].title.slice(1, -1)+`</span><br>
					<span class="main_article_author">By `+`<span class="author" data-authorname="`+object[i].user_id+`"></span> on `+new Date(object[0].date_created.slice(1, -1)).toString().slice(4,15)+`<!--. ?? replies.--></span>
				</div>
				<i class="material-icons main_article_delete `+candelete+`" onclick="deletepost(`+object[i].category_id+`,`+object[i].post_id+`);">close</i>
			</div>`;
			let newpost = createElement(newpost_htmlstring);
			main_articles.appendChild(newpost);
		}

	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function getpost(categoryid, postid) {
	let url = "/getpost?categoryid=" + categoryid + "&postid=" + postid;

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object
		console.log("postreplies: ", object);

		let article = document.getElementById("article");
		article.innerHTML = "";

		// create new post
		let newpost_htmlstring = `
			<div class="article_post">
				<h3>`+object[0].title.slice(1, -1)+`</h3>
				By <b>`+`<span class="author" data-authorname="`+object[0].user_id+`"></span>`+`</b> on `+new Date(object[0].date_created.slice(1, -1)).toString().slice(4,21)+`<br><br>
				`+object[0].content.slice(1, -1)+`
			</div>
			`;


		let newpost = createElement(newpost_htmlstring);
		article.appendChild(newpost);
		object = object[1];

		if (object.length > 0) {
			let replies_htmlstring = `
			<div class="article_reply" id="article_reply">
				<h3>Replies</h3><br>
			</div>
			`
			let replies = createElement(replies_htmlstring);
			article.appendChild(replies);

			let article_reply = document.getElementById("article_reply");
			for (let i = 0; i < object.length; i++) {
				// replies
				
				// accesscontrol: post deleteable?
				let candelete = "hidden"; // cannot delete
				if (global_userprofile != null && (
					global_userprofile["owned_categories"].includes(object[i].category_id) ||
					global_userprofile["moderator_categories"].includes(object[i].category_id) ||
					global_userprofile["id"] == object[i].user_id ||
					global_userprofile["role"] == 1)) {
					candelete = ""; // can delete
				}

				let reply_htmlstring = `
					<i class="material-icons article_reply_delete `+candelete+`" onclick="deletereply(`+object[i].category_id+`,`+object[i].post_id+`,`+object[i].reply_id+`);">close</i>
					By <b>`+`<span class="author" data-authorname="`+object[i].user_id+`"></span>`+`</b> on `+new Date(object[0].date_created.slice(1, -1)).toString().slice(4,21)+`<br><br>
					`+object[i].content.slice(1, -1)+`<br><br>
					<hr class="article_reply_break"><br><br>`;

				let newreply = createElement(reply_htmlstring);
				article_reply.appendChild(newreply);
			}
		}

		// accesscontrol: create reply?
		// only member categories are shown
		let canreply = "hidden"; // cannot delete
		if (global_userprofile != null) { //&& (
			// global_userprofile["owned_categories"].includes(object[i].category_id) ||
			// global_userprofile["moderator_categories"].includes(object[i].category_id) ||
			// global_userprofile["user_categories"].includes(object[i].user_id) || // if user is a member of the category
			// global_userprofile["role"] == 1)) {
			canreply = ""; // can delete
		}

		let createreply_htmlstring = `
			<div class="article_createreply `+canreply+`">
				<br><h3>Create Reply</h3>
				<textarea class="article_createreply_content" id="article_createreply_content" name="new_content" placeholder="Write something.."></textarea>
				<input type="submit" class="new_reply_button" id="new_reply_button" value="Create Reply" onclick="createreply(`+categoryid+`,`+postid+`);">
			</div>
			
		`
		let createreply = createElement(createreply_htmlstring);
		article.appendChild(createreply);

		getauthornames();

	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function switchpost(categoryid, postid) {
	getposts(categoryid, postid);
}
function deletepost(categoryid, postid) {
	let url = "/deletepost?categoryid=" + categoryid + "&postid=" + postid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		console.log(xhr.responseText, xhr.status);
		if(postid == currentpost) {
			currentpost = "default";
		}
		getposts(categoryid, currentpost);
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};
	xhr.send();
}
function createpost() {
	let title = document.getElementById("new_post_title");
	let content = document.getElementById("new_post_content");
	let mydata = {
		"title": title.value,
		"content": content.value
	};

	let url = "/newpost?categoryid=" + currentcategory;
	let xhr = createCORSRequest('POST', url);
	if (!xhr) {throw new Error('CORS not supported');}

	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let status = xhr.status; 
		console.log(responseStr, status);

		switchpost(currentcategory, "default");
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};

	// Actually send request to server
	console.log(JSON.stringify(mydata));
	xhr.send(JSON.stringify(mydata));
}

function createreply(categoryid, postid) {
	let content = document.getElementById("article_createreply_content");
	let mydata = {
		"content": content.value
	};

	let url = "/newreply?categoryid=" + categoryid + "&postid=" + postid;
	let xhr = createCORSRequest('POST', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let status = xhr.status; 
		console.log(responseStr, status);
		getposts(categoryid, postid);
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};

	// Actually send request to server
	console.log(JSON.stringify(mydata));
	xhr.send(JSON.stringify(mydata));
}

function deletereply(categoryid, postid, replyid) {
	let url = "/deletereply?categoryid=" + categoryid + "&postid=" + postid + "&replyid=" + replyid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		console.log(xhr.responseText, xhr.status);
		// if(postid == currentpost) {
		// 	currentpost = "default";
		// }
		getposts(categoryid, currentpost);
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};
	xhr.send();
}

function updatevisibility(categoryid) {
	let visibility = 1;
	if(document.getElementById('visibility_0').checked) {
		visibility = 0;
	}
	let url = "/updatevisibility?categoryid=" + categoryid + "&visibility=" + visibility;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}

	xhr.onload = function() {
		console.log(xhr.responseText);
	};
	xhr.onerror = function() {alert('Woops, there was an error making the request.');};
	xhr.send();
}

function logout() {
    let url = "/logout";
    let xhr = createCORSRequest('GET', url);
    if (!xhr) {throw new Error('CORS not supported');}

    xhr.onload = function() {
    	location.reload();
    }

    xhr.onerror = function() {alert('Woops, there was an error making the request.');};

    xhr.send();
}

// END BASIC FUNCTIONALITY


// ACCESS CONTROL
// username, admin, [owned_categories], [moderator_categories], [user_categories]

// function load_categoryoperations(userprofile) {
// 	console.log(userprofile);
// 	// view categories
// 	categories = document.getElementsByClassName("nav_link_text");
// 	for (let i = 0; i < categories.length; i++) {
// 		let category_id = categories[i].id.slice(-1);

// 		// view category
// 		if ()
// 		if (userprofile.owned_categories.includes(category_id) ||
// 			userprofile.moderator_categories.includes(category_id) ||
// 			userprofile.user_categories.includes(category_id) ||
// 			userprofile.role == 1) {
// 			document.getElementById("category_" + category_id).classList.remove("hidden");
// 		}

// 		// delete category
// 		if (userprofile.owned_categories.includes(category_id) ||
// 			// userprofile.moderator_categories.includes(category_id) ||
// 			// userprofile.user_categories.includes(category_id) ||
// 			userprofile.role == 1) {
// 			document.getElementById("category_delete_" + category_id).classList.remove("hidden");
// 		}
// 	}

// 	// delete category

// 	// create category

// 	// category settings
// }

// END ACCESS CONTROL

let global_categorypermissions = null;
let global_userprofile = null;

// first get userprofile
getuserprofile(function(userprofile) {
	if(userprofile != null) {
		let user_loginbutton = document.getElementById("user_loginbutton");
		user_loginbutton.textContent = "Logged in as " + userprofile.username;
		user_loginbutton.setAttribute("onClick", "");
		user_loginbutton.classList += "login_static";

		let nav_user_settings = document.getElementById("nav_user_settings");
		nav_user_settings.classList.remove("hidden");
	}

	// load:
	// delete category, create category, category settings, view categories
	// load_categoryoperations(userprofile);

	global_userprofile = userprofile;
	getcategories("default");
	// create post, delete post (view is handled by category)
	// create reply, delete reply (view is handled by category)

});

let currentcategory = "default";
let currentpost = "default";

/*
functions

create category
delete category
switch category
get categories

create post
delete post
switch post
get posts

*/
