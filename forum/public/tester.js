// Create the XHR object.
function createCORSRequest(method, url) {
	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);  // call its open method
	return xhr;
}

function updatetables() {
	updatetable("categories");
	updatetable("posts");
	updatetable("replies");
}

function updatetable(tablename) {
	let url = "/gettable?table=" + tablename;

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object

		let fancy = JSON.stringify(object);
		fancy = tablename + ":<br>" + fancy.replace(/}/g, "}<br>");

		document.getElementById("table_" + tablename).innerHTML = fancy;
	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function setupforum() {
	displaycategories();
	updatetables();
}

function displaycategories () {
	let url = "/getcategorynames";

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object

		for (let i = 0; i < object.length; i++) {
			let newcategory = document.createElement('div');
			newcategory.id = "category_" + object[i].category_id;
			newcategory.innerHTML = "<input type='button' value='delete category' style='float:right;' onclick='deletecategory("+object[i].category_id+")'>"+"<input type='button' value='edit category' style='float:right;text-decoration:line-through;'>"+"<h2>" + object[i].title + "</h2> (id: " +object[i].category_id+ ", public: " + object[i].public + ")";

			let postcreator = document.createElement('div');
			postcreator.innerHTML = '<input type="text" id="post_title_'+object[i].category_id+'" placeholder="title"><input type="text" id="post_content_'+object[i].category_id+'" placeholder="content"><input type="button" onclick="newpost('+object[i].category_id+')" value="create post">';
			newcategory.appendChild(postcreator);

			document.getElementById('categories').appendChild(newcategory);
			updateposts(object[i].category_id);
		}

		console.log(object);
		// let fancy = JSON.stringify(object);
		// fancy = tablename + ":<br>" + fancy.replace(/}/g, "}<br>");

		// document.getElementById(tablename).innerHTML = fancy;
	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function updateposts(categoryid) {
	let url = "/getcategoryposts?categoryid=" + categoryid;

	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object
		console.log(object);
		for (let i = 0; i < object.length; i++) {
			let newpost = document.createElement('div');
			newpost.id = "post_" + object[i].category_id + "_" + object[i].post_id;
			newpost.innerHTML = "<input type='button' value='delete post' style='float:right;' onclick='deletepost("+object[i].category_id+","+object[i].post_id+")'>"+"<input type='button' value='edit post' style='float:right;text-decoration:line-through;'>"+"<h3>" + object[i].title + "</h3> (id: " +object[i].category_id+ "_" + object[i].post_id + ", author: "+ object[i].user_id+", "+object[i].date_created+" )" + "<br>" + object[i].content;

			let replycreator = document.createElement('div');
			replycreator.innerHTML = '<input type="text" id="reply_content_'+object[i].category_id+"_"+object[i].post_id+'" placeholder="content"><input type="button" onclick="newreply('+object[i].category_id+","+object[i].post_id+')" value="create reply">';
			newpost.appendChild(replycreator);

			document.getElementById('category_' + categoryid).appendChild(newpost);
			updatereplies(categoryid, object[i].post_id);
		}

	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function updatereplies(categoryid, postid) {
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
		object = object[1];

		for (let i = 0; i < object.length; i++) {
			let newreply = document.createElement('div');
			newreply.id = "reply_" + object[i].category_id + "_" + object[i].post_id + "_" + object[i].post_id;
			newreply.innerHTML = "<input type='button' value='delete reply' style='float:right;' onclick='deletereply("+object[i].category_id+","+object[i].post_id+","+object[i].reply_id+")'>"+"<input type='button' value='edit reply' style='float:right;text-decoration:line-through;'>"+"(id: " +object[i].category_id+ "_" + object[i].post_id + "_" + object[i].reply_id + ", author: "+ object[i].user_id+", "+object[i].date_created+" )" + "<br>" + object[i].content;

			// let replycreator = document.createElement('div');
			// replycreator.innerHTML = '<input type="text" id="reply_content_'+object[i].category_id+"_"+object[i].post_id+'" placeholder="content"><input type="button" onclick="newreply('+object[i].category_id+","+object[i].post_id+')" value="create reply">';
			// newpost.appendChild(replycreator);

			document.getElementById('post_' + categoryid + "_" + postid).appendChild(newreply);
		}

	};

	xhr.onerror = function() { alert('error'); };
	xhr.send();
}

function newcategory() {
	let newname = document.getElementById("category_name").value;
	let public = document.getElementById("category_public").value;
	// let content = document.getElementById("post_content_" + categoryid);
	// let mydata = {
	// 	"title": title.value,
	// 	"content": content.value
	// };

	let url = "/newcategory?categoryname=" + newname + "&public=" + public;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let status = xhr.status; 
		console.log(responseStr, status);
		window.location.reload(false); 
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};

	// Actually send request to server
	// console.log(JSON.stringify(mydata));
	xhr.send();
}

function newpost(categoryid) {
	let title = document.getElementById("post_title_" + categoryid);
	let content = document.getElementById("post_content_" + categoryid);
	let mydata = {
		"title": title.value,
		"content": content.value
	};

	let url = "/newpost?categoryid=" + categoryid;
	let xhr = createCORSRequest('POST', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let status = xhr.status; 
		console.log(responseStr, status);
		window.location.reload(false); 
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};

	// Actually send request to server
	console.log(JSON.stringify(mydata));
	xhr.send(JSON.stringify(mydata));
}

function newreply(categoryid, postid) {
	// let title = document.getElementById("post_title_" + categoryid);
	let content = document.getElementById("reply_content_" + categoryid + "_" + postid);
	let mydata = {
		// "title": title.value,
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
		window.location.reload(false); 
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};

	// Actually send request to server
	console.log(JSON.stringify(mydata));
	xhr.send(JSON.stringify(mydata));
}

function deletecategory(categoryid) {

	let url = "/deletecategory?categoryid=" + categoryid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		console.log(xhr.responseText, xhr.status);
		window.location.reload(false); 
	};

	xhr.onerror = function() {alert('Woops, there was an error making the request.');};
	xhr.send();
}

function deletepost(categoryid, postid) {

	let url = "/deletepost?categoryid=" + categoryid + "&postid=" + postid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		console.log(xhr.responseText, xhr.status);
		window.location.reload(false); 
	};
	
	xhr.onerror = function() {alert('Woops, there was an error making the request.');};
	xhr.send();
}

function deletereply(categoryid, postid, replyid) {

	let url = "/deletereply?categoryid=" + categoryid + "&postid=" + postid + "&replyid=" + replyid;
	let xhr = createCORSRequest('GET', url);
	if (!xhr) { throw new Error('CORS not supported');}
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		console.log(xhr.responseText, xhr.status);
		window.location.reload(false); 
	};
	
	xhr.onerror = function() {alert('Woops, there was an error making the request.');};
	xhr.send();
}

setupforum();