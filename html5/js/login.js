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
		alert("error: " + err);
	}).success(function(data) {
		var resp = JSON.parse(data);
		if (resp.error === true)
			alert("failure: " + resp.message);
		else
			alert("success");
	});
}

// loginBox is a jQuery object representing the container element
// into which we will insert the login controls
function initLoginBox(loginBox) {
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
		table.append(tr);

		//form.append(table);
		loginBox.append(table);
	} catch (e) {
		console.log(e);
	}
}
