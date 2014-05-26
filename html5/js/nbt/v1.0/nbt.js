/**
 * Return all active leagues. If token is not null and access level
 * is League Admin or greater, inactive leagues and leagues in development
 * will also be returned.
 */

var urlPrefix = "http://";

function fetchLeagues(token, cbSuccess, cbErr) {
	// token may be null for this
	
	$.ajax({
		url: urlPrefix + location.hostname + ":8080/api/v1.0/leagues",
		type: "GET",
		data: JSON.stringify(token)
	}).error(function (errText) {
		cbErr(errText); 
	}).success(function(data) {
		var resp = JSON.parse(data);
		if (resp.error === true)
			cbErr(resp.message);
		else {
			var resp = JSON.parse(data);
			cbSuccess(resp.data);
		}
	});
	
	return null;
}

/**
 * Return all visible units in indicated league. If token access level is 
 * "League Member" or better, detailed (public) information is returned for
 * all units in the array. If token access level is "League Admin" or better,
 * detailed (private) information is returned as well.
 */
function fetchUnits(token, leagueId, cbSuccess, cbErr) {
	// validate inputs
	if (token == null)
		return "token may not be null";
	if (leagueId == null || leagueId.length <= 0)
		return "leagueId may not be null or zero-length";
	
	$.ajax({
		url: urlPrefix + location.hostname + ":8080/api/v1.0/" + leagueId + "/unit",
		type: "GET",
		data: JSON.stringify(token)
	}).error(function (errText) {
		cbErr(errText); 
	}).success(function(data) {
		var resp = JSON.parse(data);
		if (resp.error === true)
			cbErr(resp.message);
		else {
			var resp = JSON.parse(data);
			cbSuccess(resp.data);
		}
	});
	
	return null;
}

/**
 * Create an editable table in 'container' using the objects in 'objArray'
 * and header data from 'headerArray', which is an associative array with 
 * keys matching field names on the objects in objArray, and the values
 * used to display the header text.
 * 
 * @param container
 * @param objArray
 * @param headerArray
 */
function createEditableTable(container, objArray, headerArray) {
	var table = $("<table/>", {id: "unitTable", class: "editable_data_table"});
	var tr = $("<tr/>");
	
	var fields = [];
	$.each(headerArray, function(key, val) {
		$("<th/>").text(val).appendTo(tr);
		fields.push(key);
	});
	table.append(tr);
	
	$.each(objArray, function(key, val) {
		// in this case, the 'val' is the object with the data for this row
		tr = $("<tr/>");
		$.each(fields, function(k, v) {
			$("<td/>").text(val[v]).appendTo(tr);
		});
		table.append(tr);
	});

	container.append(table);
}