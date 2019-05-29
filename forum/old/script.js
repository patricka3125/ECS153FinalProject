
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

// Create the XHR object.
function createCORSRequest(method, url) {
	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);  // call its open method
	return xhr;
}

function removepostsfrompage() {
	toremove = document.getElementsByClassName("post");
	while (toremove.length > 0) {
		toremove[0].remove();
	}
}

function clearform() {
	document.getElementById('new_post_button').value = 'Create Post'; 
	document.getElementById('new_post_title').value = ''; 
	document.getElementById('new_post_content').value = ''; 

}

function sendnewpost() {
	
	// get text
	let title = document.getElementById("new_post_title");
	let content = document.getElementById("new_post_content");
	let mydata = {
		"title": title.value,
		"content": content.value
	};

	// // input validation
	// title.style.borderBottom = "";
	// content.style.borderBottom = "";

	// if(title.value == '') {
	// 	title.style.borderBottom = "1px solid red";
	// }
	// if(content.value == '') {
	// 	content.style.borderBottom = "1px solid red";
	// }
	// if(title.value == '' || content.value == '') {
	// 	return false;
	// }


	// visual things
	document.getElementById('new_post_button').value = 'Creating...'; 
	// document.getElementById('createanimation').style.margin = 0; 

	let url = "/newpost";
	let xhr = createCORSRequest('POST', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}
	// xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let status = xhr.status; 
		console.log(responseStr, status);


		// document.location.reload(false);
		removepostsfrompage();
		getposts();

		clearform();
	};

	xhr.onerror = function() {
		alert('Woops, there was an error making the request.');
	};

	// Actually send request to server
	console.log(JSON.stringify(mydata));
	xhr.send(JSON.stringify(mydata));
	// xhr.send();
	// xhr.send('test: 123');

}

// // get response using CORS
// function getresponse() {
// 	word = document.getElementById("word");
// 	let url = "query?word=" + word.value;

//   	// checking if browser does CORS
// 	let xhr = createCORSRequest('GET', url);
// 	if (!xhr) {
// 	  	throw new Error('CORS not supported');
// 	}

//   	// Load some functions into response handlers.
// 	xhr.onload = function() {
// 		let responseStr = xhr.responseText;  // get the JSON string 
// 		let object = JSON.parse(responseStr);  // turn it into an object
		
// 		let output = document.getElementById("outputGoesHere");
// 		output.textContent = object.palindrome;
// 	};

// 	xhr.onerror = function() {
// 		alert('Woops, there was an error making the request.');
// 	};

// 	// Actually send request to server
// 	xhr.send();
// }

function insertposts(object) {
	// put posts into page
	let i = 0;
	for (i = object.length-1; i >= 0; i--) { 
		let div_post = document.createElement('div');
		div_post.className = "post";

		let div_bar = document.createElement('div');
		div_bar.className = "bar";
		div_bar.textContent = "Anonymous";

		let formatteddate = new Date(object[i].date.slice(1, -1));
		let span_datetime = document.createElement('span');
		span_datetime.className = "datetime";
		span_datetime.textContent = formatteddate.toLocaleString();

		let h3_title = document.createElement('h3');
		// h3_title.className = "title";
		h3_title.textContent = object[i].title.slice(1, -1);

		let p_content = document.createElement('p');
		p_content.textContent = object[i].content.slice(1, -1);

		div_bar.appendChild(span_datetime);
		div_post.appendChild(div_bar);
		div_post.appendChild(h3_title);
		div_post.appendChild(p_content);

		let insertlocation = document.getElementById("main");
		insertlocation.appendChild(div_post);
		// <div class="post">
		// 	<div class="bar">Author<span class="datetime">5/12/19 3:36pm</span></div>
		// 	<h3>Example Post Title</h3>
		// 	<p>Example post content. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<p>
		// </div>
		
	}
}

// get response using CORS
function getposts() {
	let url = "/getposts";

  	// checking if browser does CORS
	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		// console.log(responseStr);
		let object = JSON.parse(responseStr);  // turn it into an object
		console.log(object);
		
		insertposts(object);
		// let output = document.getElementById("outputGoesHere");
		// output.textContent = object.palindrome;
	};

	xhr.onerror = function() {
		alert('Woops, there was an error making the request.');
	};

	// Actually send request to server
	xhr.send();
}

function clearposts() {
	let url = "/clearposts";

  	// checking if browser does CORS
	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		// console.log(responseStr);
		// let object = JSON.parse(responseStr);  // turn it into an object
		console.log(responseStr);
		
		// document.location.reload(false);
		removepostsfrompage();
		getposts();
	};

	xhr.onerror = function() {
		alert('Woops, there was an error making the request.');
	};

	// Actually send request to server
	xhr.send();
}

getposts();
