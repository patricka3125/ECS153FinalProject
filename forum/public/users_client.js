// Create the XHR object.
function createCORSRequest(method, url) {
	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);  // call its open method
	return xhr;
}

function sign_up() {
    let username = document.getElementById("new_username");
    let password = document.getElementById("new_password");
    let url = "/create_user?username=" + username.value + "&password=" + password.value;

    // checking if browser does CORS
	let xhr = createCORSRequest('POST', url);
	if (!xhr) { throw new Error('CORS not supported'); }
    
    xhr.onload = function() {
        let responseStr = xhr.responseText;
        let status = xhr.status;
        console.log(responseStr,status);
    };

    xhr.onerror = function() { alert('Error occured.'); };

    xhr.send();
}
