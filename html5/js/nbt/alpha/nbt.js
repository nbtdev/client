function saveObjectToCookie(name, value) {
    var strValue = JSON.stringify(value);
    var cookie = document.cookie;
    cookie = name + "=" + strToken;
}

function saveToCookie(name, value) {
    var cookie = document.cookie;
    cookie = name + "=" + value;
}

function loadObjectFromCookie(name) {
    var cookie = document.cookie;
    var cookies = cookie.split(';');
    var needle = name + "=";
    for (var i=0; i<cookies.length; ++i) {
        var c = cookies[i].trim();
        if (c.indexOf(needle) === 0) {
            return JSON.parse(c.substring(needle.length, c.length));
        }
    }

    return null;
}

function loadFromCookie(name) {
    var cookie = document.cookie;
    var cookies = cookie.split(';');
    var needle = name + "=";
    for (var i=0; i<cookies.length; ++i) {
        var c = cookies[i].trim();
        if (c.indexOf(needle) === 0) {
            return c.substring(needle.length, c.length);
        }
    }

    return null;
}

function onLogin(loginBox, txtUsername, txtPassword) {
    console.log(txtUsername.value, txtPassword.value);
    txtUsername.value = "";
    txtPassword.value = "";
}

function makeUrl(uri) {
    return "http://" + location.hostname + ":" + location.port + uri;
}

function createDropdownSelect(contentUri, parentElement, token) {

    var headers = {};
    if (token !== null)
        headers = {"X-NBT-Token": token.value};

    $.ajax({
        url: makeUrl(contentUri),
        type: "GET",
        headers: headers
    }).error(function (errText) {
        cbErr(errText);
    }).success(function(resp) {
        if (resp.error === true)
            console.log(resp.message);
        else {
            // create a dropdown select and add it to parentElement
            var cmb = $("<select/>");

            $(parentElement).append(cmb);
        }
    });
}
