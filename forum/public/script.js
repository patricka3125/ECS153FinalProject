// Create the XHR object.
function createCORSRequest(method, url) {
	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);  // call its open method
	return xhr;
}

function createpost() {
	
}

// get response using CORS
function getresponse() {
	word = document.getElementById("word");
	let url = "query?word=" + word.value;

  	// checking if browser does CORS
	let xhr = createCORSRequest('GET', url);
	if (!xhr) {
	  	throw new Error('CORS not supported');
	}

  	// Load some functions into response handlers.
	xhr.onload = function() {
		let responseStr = xhr.responseText;  // get the JSON string 
		let object = JSON.parse(responseStr);  // turn it into an object
		
		let output = document.getElementById("outputGoesHere");
		output.textContent = object.palindrome;
	};

	xhr.onerror = function() {
		alert('Woops, there was an error making the request.');
	};

	// Actually send request to server
	xhr.send();
}