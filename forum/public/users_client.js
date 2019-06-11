// Execute a function when the user releases a key on the keyboard
document.getElementById("password").addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    login();
  }
});

// Create the XHR object.
function createCORSRequest(method, url) {
	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);  // call its open method
	return xhr;
}

function signup() {
    let username = document.getElementById("new_username");
    let password = document.getElementById("new_password");
    let mydata = {
        "username": username.value,
        "password": password.value
    };
    let url = "/create_user";

    // checking if browser does CORS
	let xhr = createCORSRequest('POST', url);
	if (!xhr) { throw new Error('CORS not supported'); }
    
    xhr.setRequestHeader('Content-type', 'application/json');

    xhr.onload = function() {
        let responseStr = xhr.responseText;
        let status = xhr.status;
        console.log(responseStr,status);

        if(status == 200) { // success, try to login
            document.getElementById("form").style.display = "none";
            document.getElementById("box2").style.display = "none";
            document.getElementById("successmessage").style.display = "block";
        }
        else {
            console.log("error creating");
        }
    };

    xhr.onerror = function() { alert('Error occured.'); };

    xhr.send(JSON.stringify(mydata));
}

function login() {
    let username = document.getElementById("username");
    let password = document.getElementById("password");
    let mydata = {
        "username": username.value,
        "password": password.value
    };
    let url = "/login";

    // checking if browser does CORS
    let xhr = createCORSRequest('POST', url);
    if (!xhr) { throw new Error('CORS not supported'); }
    
    xhr.setRequestHeader('Content-type', 'application/json');

    xhr.onload = function() {
        let responseStr = xhr.responseText;
        let status = xhr.status;
        console.log(responseStr,status);

        if(status == 401) { // failure
            document.getElementById("errormessage").textContent = "Invalid username or password";
        }
        else if(status=200) { // success
            window.location = "../";
        }
        else {
            console.log("this should not happen");
        }
    };

    xhr.onerror = function() { alert('Error occured.'); };

    xhr.send(JSON.stringify(mydata));
}
