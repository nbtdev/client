var token = null;

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
		if (resp.error === true)
			$("#loginBoxStatus").text(resp.message);
		else {
			var resp = JSON.parse(data);
			token = resp.data;
			
			// replace login box with logged-in verbiage
			var box = $("#loginBox");
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
	
			//form.append(table);
			loginBox.append(table);
		} catch (e) {
			console.log(e);
		}
	}
	else {
		// check to see if token is valid
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
	}
}
