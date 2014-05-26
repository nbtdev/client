// "the" token
var token = null;

// check cookies to see if we saved off a previous token
var cookieString = document.cookie;
var cookies = cookieString.split(';');
var needle = "nbt_token=";
for (var i=0; i<cookies.length; ++i) {
	var c = cookies[i].trim();
	if (c.indexOf(needle)==0) {
		token = JSON.parse(c.substring(needle.length, c.length));
		break;
	}
}

function setLoggedIn(box) {
	box.empty();
	
	var table = $("<table/>");
	var tr = $("<tr/>");
	var td = $("<td/>");
	td.text("Logged in as " + token.displayName);
	tr.append(td);
	td = $("<td/>", {
		class: "pseudo_link",
		onclick: "onLogout()"
	});
	td.text("(Log Out)");
	tr.append(td);
	table.append(tr);
	
	box.append(table);
}

function isTokenValid(tok) {
	$.ajax({
		url: "http://" + location.hostname + ":8080/api/v1.0/login/" + tok.value,
		type: "GET"
	}).error(function(err) {
		alert(err);
	}).success(function(data) {
		var resp = JSON.parse(data);
		if (resp.error === true)
			alert(resp.message);
		else {
			var resp = JSON.parse(data);
			return resp.data;
		}
	});

	return true;
}

function onLogin() {
	var login = new Object();
	login.username = $("#txtUsername").val();
	login.password = $("#txtPassword").val();
	
	$.ajax({
		url: "http://" + location.hostname + ":8080/api/v1.0/login",
		type: "POST", 
		data: JSON.stringify(login)
	}).error(function(err) {
		alert(err);
	}).success(function(data) {
		var resp = JSON.parse(data);
		var loginBox = $("#loginBox");
		var loginBoxStatus = $("#loginBoxStatus");
		
		if (resp.error === true)
			loginBoxStatus.text(resp.message);
		else {
			var resp = JSON.parse(data);
			token = resp.data;
			
			if ($("#chkRememberMe").is(':checked')) {
				// if the user has the "remember me" box checked, store
				// the token value in a cookie
//				var expString = $.format.date(token.expiry, 'yyyy/MM/dd HH:mm:ss');
//				document.cookie="nbt_token=" + JSON.stringify(token) = "; expires=" + expString;
				document.cookie="nbt_token=" + JSON.stringify(token);
			}
			
			// replace login box with logged-in verbiage
			setLoggedIn(loginBox);
		}		
	});
}

// loginBox is a jQuery object representing the container element
// into which we will insert the login controls
function initLoginBox(loginBox) {
	if (!token) {
		try {
			loginBox.empty();
			var form = $("<form/>");
			var table = $("<table/>");
			var tr = $("<tr/>");
			var td = $("<td/>");
			td.text("Username:");
			tr.append(td);
			
			td = $("<td/>");
			var inp = $("<input/>", {
				id: "txtUsername",
				type: "text"
			});
			td.append(inp);
			tr.append(td);
			
			table.append(tr);
			
			tr = $("<tr/>");
			td = $("<td/>");
			td.text("Password:");
			tr.append(td);
			
			td = $("<td/>");
			inp = $("<input/>", {
				id: "txtPassword",
				type: "password"
			});
			td.append(inp);
			tr.append(td);
			table.append(tr);
			
			tr = $("<tr/>");
			td = $("<td/>");
			inp = $("<input/>", {
				name: "cmdLogin",
				type: "button",
				value: "Login",
				onclick: "onLogin()"
			});
			td.append(inp);
			tr.append(td);
			
			td = $("<td/>", {
				class: "loginBoxStatus",
				id: "loginBoxStatus"
			});
			tr.append(td);
			table.append(tr);
			
			tr = $("<tr/>");
			td = $("<td/>", {
				colspan: "2"
			});
			inp = $("<input/>", {
				type: "checkbox",
				id: "chkRememberMe",
			});

			td.append(inp);
			td.append("Remember me");
			tr.append(td);
			table.append(tr);
	
			//form.append(table);
			loginBox.append(table);
		} catch (e) {
			console.log(e);
		}
	}
	else {
		setLoggedIn(loginBox);
	}
}

function onLogout() {
	if (token) {
		$.ajax({
			url: "http://" + location.hostname + ":8080/api/v1.0/login",
			type: "DELETE", 
			data: JSON.stringify(token)
		});
		
		// regardless of success or failure, perform the logout stuff
		token = null;
		initLoginBox($("#loginBox"));
		
		// clear login token cookie
		document.cookie = "nbt_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
	}
}

// actually check the server to see if token is valid (if it's set)
if (token) {
	var loginBox = $("#loginBox");
	if (isTokenValid(token))
		setLoggedIn(loginBox);
	else
		initLoginBox(loginBox);
}