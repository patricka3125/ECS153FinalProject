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
	let main_articles = document.getElementById("main_articles")
	let main_articlecreator_htmlstring = `
	<div class="main_article">
		<div class="main_article_left"><i class="material-icons main_article_icon">edit</i></div>
		<div class="main_article_right">
			<span class="main_article_title">New Article Draft</span><br>
			<span class="main_article_author">By Username</span>
		</div>
	</div>`;
	let main_articlecreator = createElement(main_articlecreator_htmlstring);
	main_articles.prepend(main_articlecreator);

	let article = document.getElementById("article");
	article.innerHTML = `
	<input type="text" id="new_post_title" name="new_title" placeholder="New Post Title">
	<textarea id="new_post_content" name="new_content" placeholder="Write something.." style="height:98px;overflow-y:hidden;"></textarea>
	`;
	// let main_articlecreator = createElement(main_articlecreator_htmlstring);
	// article.prepend(main_articlecreator);

	// <input type="text" id="new_post_title" name="new_title" placeholder="New Post Title">
	// <textarea id="new_post_content" name="new_content" placeholder="Write something.." style="height:98px;overflow-y:hidden;"></textarea>
}

function getcategories(categoryid) {
	let url = "/getcategorynames";
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object

		let nav_links = document.getElementById("nav_links");
		nav_links.innerHTML = "";

		for (let i = 0; i < object.length; i++) {
			let activecategoryclass = "";
			if (categoryid == "default" && i == 0) {
				activecategoryclass = "nav_link_active";
				currentcategory = object[i].category_id;
				document.getElementById("main_title").textContent = object[i].title;
			}
			else if (categoryid == object[i].category_id) {
				activecategoryclass = "nav_link_active";
				currentcategory = object[i].category_id;
				document.getElementById("main_title").textContent = object[i].title;
			}
			let newcategory_htmlstring = `
			<div class="nav_link `+activecategoryclass+`" id="category_`+object[i].category_id+`">
				<i class="material-icons nav_delete" onclick="deletecategory(`+object[i].category_id+`);">close</i>
				<span class="nav_link_text" onclick="switchcategory(`+object[i].category_id+`);">
					`+object[i].title+`<br>? Posts
				</span>
			</div>`;
			let newcategory = createElement(newcategory_htmlstring);
			nav_links.appendChild(newcategory);


// object[i].category_id, object[i].title.slice(1, -1), object[i].public 
		}

		getposts(currentcategory, "default");

		console.log(object);
	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
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

function getposts(categoryid, postid) {
	let url = "/getcategoryposts?categoryid=" + categoryid;

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {throw new Error('CORS not supported');}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object
		console.log(object);

		let main_articles = document.getElementById("main_articles");
		main_articles.innerHTML = "";

		for (let i = 0; i < object.length; i++) {

			let activepostclass = "";
			let workingpostid = object[i].category_id + "_" + object[i].post_id;
			if (postid == "default" && i == 0) {
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
			let newpost_htmlstring = `
			<div class="main_article `+activepostclass+`" id="post_`+workingpostid+`">
				<div class="main_article_left"><i class="material-icons main_article_icon">account_circle</i></div>
				<div class="main_article_right" onclick="switchpost(`+object[i].category_id+`,`+object[i].post_id+`);">
					<span class="main_article_title">`+object[i].title.slice(1, -1)+`</span><br>
					<span class="main_article_author">By `+object[i].author+`. ?? replies.</span>
				</div>
				<i class="material-icons main_article_delete" onclick="deletepost(`+object[i].category_id+`,`+object[i].post_id+`);">close</i>
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
		console.log(object);

		let article = document.getElementById("article");
		article.innerHTML = "";

		// create new post
		let newpost_htmlstring = `
			<div class="article_post">
				<h3>`+object[0].title.slice(1, -1)+`</h3>
				By <b>`+object[0].author+`</b> on `+object[0].date_created.slice(1, -1)+`<br><br>
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
				

				// create new post
				let reply_htmlstring = `
					<b>`+object[i].author+`</b> on `+object[i].date_created.slice(1, -1)+`<br><br>
					`+object[i].content.slice(1, -1)+`<br><br>
					<hr class="article_reply_break"><br><br>`;

				let newreply = createElement(reply_htmlstring);
				article_reply.appendChild(newreply);
			}
		}

		

		let createreply_htmlstring = `
			<div class="article_createreply">
				<br><h3>Create Reply</h3>
				<textarea class="article_createreply_content" id="article_createreply_content" name="new_content" placeholder="Write something.."></textarea>
			</div>
			
		`
		let createreply = createElement(createreply_htmlstring);
		article.appendChild(createreply);

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

getcategories("default");
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