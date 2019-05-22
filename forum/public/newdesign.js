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
	let articlecreator_htmlstring = `
	<div class="main_article">
		<div class="main_article_left"><i class="material-icons main_article_icon">edit</i></div>
		<div class="main_article_right">
			<span class="main_article_title">New Article Draft</span><br>
			<span class="main_article_author">By Username</span>
		</div>
	</div>`
	let articlecreator = createElement(articlecreator_htmlstring);
	main_articles.prepend(articlecreator);
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
			</div>`
			let newcategory = createElement(newcategory_htmlstring);
			nav_links.appendChild(newcategory);


// object[i].category_id, object[i].title, object[i].public 
		}

		getposts(currentcategory);

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

function getposts(categoryid) {
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

			// let newpost = document.createElement('div');
			// newpost.id = "post_" + object[i].category_id + "_" + object[i].post_id;
			// newpost.innerHTML = "<input type='button' value='delete post' style='float:right;' onclick='deletepost("+object[i].category_id+","+object[i].post_id+")'>"+"<input type='button' value='edit post' style='float:right;text-decoration:line-through;'>"+"<h3>" + object[i].title + "</h3> (id: " +object[i].category_id+ "_" + object[i].post_id + ", author: "+ object[i].user_id+", "+object[i].date_created+" )" + "<br>" + object[i].content;

			// let replycreator = document.createElement('div');
			// replycreator.innerHTML = '<input type="text" id="reply_content_'+object[i].category_id+"_"+object[i].post_id+'" placeholder="content"><input type="button" onclick="newreply('+object[i].category_id+","+object[i].post_id+')" value="create reply">';
			// newpost.appendChild(replycreator);

			// document.getElementById('category_' + categoryid).appendChild(newpost);
			// updatereplies(categoryid, object[i].post_id);

			let activepostclass = "";
			let workingpostid = object[i].category_id + "_" + object[i].post_id;
			if (currentpost == "default" && i == 0) {
				activepostclass = "main_article_active";
				currentpost = workingpostid;
				getpost(object[i].category_id, object[i].post_id);
				// document.getElementById("main_title").textContent = object[i].title;
			}
			else if (currentpost == workingpostid) {
				activepostclass = "main_article_active";
				currentpost = workingpostid;
				getpost(object[i].category_id, object[i].post_id);
				// document.getElementById("main_title").textContent = object[i].title;
			}
			let newpost_htmlstring = `
			<div class="main_article `+activepostclass+`" id="post_`+workingpostid+`">
				<div class="main_article_left"><i class="material-icons main_article_icon">account_circle</i></div>
				<div class="main_article_right">
					<span class="main_article_title">`+object[i].title+`</span><br>
					<span class="main_article_author">By `+object[i].author+`. ?? replies.</span>
				</div>
			</div>`
			let newpost = createElement(newpost_htmlstring);
			main_articles.appendChild(newpost);
		}

	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function getpost(categoryid, postid) {

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