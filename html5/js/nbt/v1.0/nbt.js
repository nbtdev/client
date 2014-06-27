/****************************************************************************
This source file is (c) NetBattleTech. All rights reserved. 
Redistribution and/or reproduction, in whole or in part, without prior
written permission of a duly authorized representative of NetBattleTech
is prohibited.
****************************************************************************/

function NBT(token, leagueId) 
{
	this.mUrlPrefix = "http://";
	this.mUrlPort = 8080;
	this.mUrlApiVersion = "v1.0";
	this.mToken = token;
	this.mLeagueId = leagueId;

	function setToken(token) {
		this.mToken = token;
	};
	
	this.setLeagueId = function(leagueId) {
		this.mLeagueId = leagueId;
	};
	
	this.leagueId = function() {
		return this.mLeagueId;
	};
	
	this.token = function() {
		return this.mToken;
	};

	this.call = function(hostname, leagueId, resource, resourceId) 
	{
		var rtn = this.mUrlPrefix + hostname + ":" + this.mUrlPort + "/api/" + this.mUrlApiVersion;
		
		if (leagueId) {
			rtn += "/" + leagueId;
		}
		
		if (resource != null) {
			rtn += "/" + resource;
		}
		
		if (resourceId != null) {
			rtn += "/" + resourceId;
		}
		
		return rtn;
	};
	
	/**
	 * Return all active leagues. If token is not null and access level
	 * is League Admin or greater, inactive leagues and leagues in development
	 * will also be returned.
	 */
	this.fetchLeagues = function(cbSuccess, cbErr) {
		// token may be null for this
		
		var strToken = JSON.stringify(this.mToken);
		
		$.ajax({
			url: this.call(location.hostname, null, "leagues"),
			type: "GET",
			data: strToken
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
	};

	/**
	 * Return all visible units in indicated league. If token access level is 
	 * "League Member" or better, detailed (public) information is returned for
	 * all units in the array. If token access level is "League Admin" or better,
	 * detailed (private) information is returned as well.
	 */
	this.fetchUnits = function(cbSuccess, cbErr) {
		// validate inputs
		if (this.mToken == null) {
			console.log("token may not be null");
			return "token may not be null";
		}
		if (this.mLeagueId == null || this.mLeagueId.length <= 0) {
			console.log("leagueId may not be null or zero-length");
			return "leagueId may not be null or zero-length";
		}
		
		$.ajax({
			url: this.call(location.hostname, this.mLeagueId, "unit"),
			type: "GET",
			data: JSON.stringify(this.mToken)
		}).error(function (errText) {
			cbErr(errText); 
		}).success(function(data) {
			var resp = JSON.parse(data);
			if (resp.error === true)
				cbErr(resp.message);
			else {
				var resp = JSON.parse(data);
				cbSuccess(resp.data, resp.canEdit);
			}
		});
		
		return null;
	};

	this.fetchUsers = function(cbSuccess, cbErr) {
		// validate inputs
		if (this.mToken == null) {
			console.log("token may not be null");
			return "token may not be null";
		}
		if (this.mLeagueId == null || this.mLeagueId.length <= 0) {
			console.log("leagueId may not be null or zero-length");
			return "leagueId may not be null or zero-length";
		}
		
		$.ajax({
			url: this.call(location.hostname, "security", "user"),
			type: "GET",
			data: JSON.stringify(this.mToken)
		}).error(function (errText) {
			cbErr(errText); 
		}).success(function(data) {
			var resp = JSON.parse(data);
			if (resp.error === true)
				cbErr(resp.message);
			else {
				var resp = JSON.parse(data);
				cbSuccess(resp.data, resp.canEdit);
			}
		});
		
		return null;
	};
}

function populateDropdown(token, lstDropdown, selected, resourceName) {
	var strToken = JSON.stringify(token);

	$.ajax({
		url: API.call(location.hostname, "system", resourceName),
		type: "GET",
		data: strToken
	}).error(function(msg) {
		alert(msg);
	}).success( function(data) {
		$(lstDropdown).empty();
		var resp = JSON.parse(data);
		$.each(resp.data, function(i, item) {
			var opt = $("<option/>", {
				value: item.key,
				text: item.value
			});
			
			if (item.value === selected)
				opt.prop('selected', true);
			
			$(lstDropdown).append(opt);
		});
	});
}

function populateUnitStatus(lstStatus, selected, token) {
	populateDropdown(token, lstStatus, selected, "unitStatus");
}

function populateUnitClass(lstClass, selected, token) {
	populateDropdown(token, lstClass, selected, "unitClass");
}

function populateTimezone(lstTimezone, selected, token) {
	populateDropdown(token, lstTimezone, selected, "timezone");
}

function populateUserStatus(lstStatus, selected, token) {
	populateDropdown(token, lstStatus, selected, "userStatus");
}

function populateUnitDropdown(lstStatus, selected, token) {
	populateDropdown(token, lstStatus, selected, "units");
}

function populateRoles(lstStatus, selected, token) {
	populateDropdown(token, lstStatus, selected, "roles");
}

// header definition for EditableTable; this class is typically used as the value in an associative array, where the
// array key is the field name in a corresponding data object (row data)
function HeaderElement(initObj)
{
	this.mHeaderText = initObj.headerText;
	this.mSortable = initObj.sortable;
	
	// mark this column as containing "list" data
	this.mIsList = initObj.isList;
	// when editing, call this function to populate the list data (dropdown). The function should take two arguments: the <select> 
	// element to populate, and the currently-selected value (in that order)
	this.mListPopulate = initObj.listPopulate;
	
	// mark this column as containing image data, by providing an image URL
	this.mImageUrl = initObj.imageUrl;
	
	// mark this column as containing a hyperlink (should be rendered as such) 
	this.mIsLink = initObj.isLink;
	
	// link text (if mIsLink)
	this.mLinkText = initObj.linkText;
	
	// allow calling code to modify a particular value in this column (to support alternative display types, etc)
	this.mMutator = initObj.mutator;
	
	// cannot be edited in this table
	this.mReadOnly = initObj.readOnly;
}

/**
 * EditableTable class
 * 
 * This class manages all details of editable data, displayed in
 * a table with rows that expand to show and edit row details.
 * 
 * The two templates (detailTmpl and editTmpl) must use ID values that follow a specific pattern. Detail template IDs should begin with
 * "detail_tmpl_", and concatenated to that, should  
 * 
 * @param container The HTML container (<div>, for example) in which the table will live
 * @param detailTmpl The HTML template (<div>, for example) that will be used for displaying row detail. 
 * @param editTmpl The HTML container (<div>, for example) that will be used for editing row detail (and for editing new row data)
 * @param objArray  The data displayed in the table (one row per object array element). Each object array element should have field values that correspond to the "field name" keys in the 'headerArray' parameter.
 * @param headerArray Associative array of "field name" -> "header text" values, that also determines how the columns will be arranged. Elements of the header array are HeaderElement objects. 
 * @param saveCallback Function taking a single parameter (data) for saving edited/added object data (added data will have no unique identifier)
 * @param deleteCallback Function taking a single parameter (data) for deleting object data
 */

function EditableTable(
		token,
		container,
		detailTmpl,
		editTmpl,
		objArray,
		headerArray,
		saveCallback,
		deleteCallback) 
{
	// reference to security token
	this.mToken = token;
	// reference to <div> containing the row-detail template
	this.mDetailTmpl = detailTmpl;
	// reference to <div> containing the row-edit template
	this.mEditTmpl = editTmpl;
	// reference to table's parent container
	this.mParent = container;
	// object array (row) data
	this.mData = objArray;
	// header definition array
	this.mHeaders = headerArray;
	// flag to determine if table can be edited (rows added/removed)
	this.mCanEdit = false;
	// callback for saving modified/new data object
	this.mSave = saveCallback;
	// callback for deleting data object
	this.mDelete = deleteCallback;
	
	// internal state management
	this.TableState = {
		NORMAL: 0,
		DETAIL: 1,
		EDIT: 2,
		ADD: 3
	};
	
	this.mState = this.TableState.NORMAL;
	
	this.mCurrentRow = null;
}

EditableTable.prototype.onRowClicked = function(event) {
	var unitDetail = event.data.unit;
	var table = event.data.table;
	var row = event.currentTarget;

	if (table.mState != table.TableState.NORMAL && table.mState != table.TableState.DETAIL)
		return;

	if (table.mCurrentRow) {
		// restore this row
		$(table.mCurrentRow).show();
	}
	
	table.mCurrentRow = row;
	
	var tr = $("<tr/>", {
		class: "no_select"
	});
	tr.insertAfter(row);
	$(row).hide();
	
	var td = $("<td/>", {
		colspan: Object.keys(table.mHeaders).length,
		style: "text-align: center;"
	});
	tr.append(td);
	
	// append the detail template to the td, and show it
	td.append(table.mDetailTmpl);
	$(table.mDetailTmpl).show();
	
	// and fill in all of the properties, as applies
	$.each(unitDetail, function(key, val) {
		var pattern = "#detail_tmpl_" + key;
		var item = $(pattern);
		if (item.length) {
			item.text(val);
		}
	});
	
	// hook up the buttons
	$("#cmdDetailClose").bind("click", {unit: unitDetail, table: table, tableRow: tr}, table.onDetailClose);
	$("#cmdDetailEdit").bind("click", {unit: unitDetail, table: table, tableRow: tr}, table.onDetailEdit);
	$("#cmdDetailDelete").bind("click", {unit: unitDetail, table: table, tableRow: tr}, table.onDetailDelete);
	
	// change state
	table.mState = table.TableState.DETAIL;
}

EditableTable.prototype.onDetailClose = function(event) {
	var unitDetail = event.data.unit;
	var table = event.data.table;
	var detailRow = event.data.tableRow;

	// unhook the buttons
	$("#cmdDetailClose").unbind("click", table.onDetailClose);
	$("#cmdDetailEdit").unbind("click", table.onDetailEdit);
	$("#cmdDetailDelete").unbind("click", table.onDetailDelete);
	
	// hide the table
	$(table.mDetailTmpl).hide();
	
	// show the hidden row, and park the detail template next to the edit template
	if (table.mCurrentRow) {
		$(table.mCurrentRow).show();
		$(table.mDetailTmpl).insertAfter(table.mEditTmpl);
	}

	// get rid of the detail row
	$(detailRow).remove();
	
	// clear the "current" row
	table.mCurrentRow = null;
	
	// change table state back to normal
	table.mState = table.TableState.NORMAL;
}

EditableTable.prototype.onDetailEdit = function(event) {
	var unitDetail = event.data.unit;
	var table = event.data.table;
	var row = event.tableRow;
	
	// we are "replacing" the current detail template with the editing template in the currently open row
	// so all we need to do is hide the detail template and move/show the edit template
	$(table.mEditTmpl).insertAfter(table.mDetailTmpl);
	$(table.mDetailTmpl).hide();
	$(table.mEditTmpl).show();
	
	// and fill in all of the properties, as applies
	$.each(unitDetail, function(key, val) {
		var pattern = "#edit_tmpl_" + key;
		var item = $(pattern);
		if (item.length) {
			// get the column type from the headers list
			var info = table.mHeaders[key];
			if (info) {
				if (info.mIsList) {
					// invoke the populate fn on the select element
					info.mListPopulate(item, val, table.mToken);
				}
				else if (info.mImageUrl) {
					
				}
				else {
					if (info.mReadOnly)
						item.text(val);
					else
						// for simple text types, use .val()
						item.val(val);
				}
			}
			else {
				// for simple text types, use .val()
				item.val(val);
			}
		}
	});
	
	// hook up the buttons
	$("#cmdDetailEditorCancel").bind("click", {unit: unitDetail, table: table, tableRow: row}, table.onDetailEditorCancel);
	$("#cmdDetailEditorSave").bind("click", {unit: unitDetail, table: table, tableRow: row}, table.onDetailEditorSave);
	
	// change state
	table.mState = table.TableState.EDIT;
}

EditableTable.prototype.onDetailEditorCancel = function(event) {
	var table = event.data.table;
	var row = event.tableRow;

	// hide the edit tmpl, show the detail tmpl (should still have the data in it), change state
	$(table.mDetailTmpl).show();
	$(table.mEditTmpl).hide();

	// unbind the buttons
	$("#cmdDetailEditorCancel").unbind("click", table.onDetailEditorCancel);
	$("#cmdDetailEditorSave").unbind("click", table.onDetailEditorSave);
	
	table.mState = table.TableState.DETAIL;
}

EditableTable.prototype.onDetailEditorSave = function(event) {
	var table = event.data.table;
	var unitDetail = event.data.unit;
	var row = event.data.tableRow;
	
	// first, construct a unitDetail from the fields in the edit tmpl form
	var elems = $("select,input[type='text'],textarea", "#" + $(table.mEditTmpl).attr("id"));
	$.each(elems, function(key, val) {
		var elemVal = $(val).val();
		var fieldName = $(val).attr("id").split("edit_tmpl_")[1];
		unitDetail[fieldName] = elemVal;
	});
	
	// submit the data
	table.mSave(table, unitDetail);
}

EditableTable.prototype.onAddNewCancel = function(event) {
	var table = event.data.table;
	var insertedRow = event.data.insertedRow;
	var addNewRow = event.data.addNewRow;

	// hide the edit tmpl, and delete the row it was in
	$(addNewRow).append(table.mEditTmpl);
	$(table.mEditTmpl).hide();
	$(insertedRow).remove();
	$(addNewRow).show();

	// unbind the buttons
	$("#cmdDetailEditorCancel").unbind("click", table.onAddNewCancel);
	$("#cmdDetailEditorSave").unbind("click", table.onAddNewSave);
	
	table.mState = table.TableState.NORMAL;
}

EditableTable.prototype.onAddNewSave = function(event) {
	var table = event.data.table;
	var insertedRow = event.data.insertedRow;
	var addNewRow = event.data.addNewRow;
	
	// first, construct a unitDetail from the fields in the edit tmpl form
	var elems = $("select,input[type='text'],textarea", "#" + $(table.mEditTmpl).attr("id"));
	var unitDetail = new Object();
	$.each(elems, function(key, val) {
		var elemVal = $(val).val();
		var fieldName = $(val).attr("id").split("edit_tmpl_")[1];
		unitDetail[fieldName] = elemVal;
	});
	
	// submit the data
	table.mSave(table, unitDetail);
}

EditableTable.prototype.onAddNew = function(event) {
	var unitDetail = event.data.unit;
	var table = event.data.table;
	var row = event.data.row;

	// only allow this in NORMAL state
	if (table.mState != table.TableState.NORMAL)
		return;
	
	// clear the edit form elements
	var tmp = $("input[type='text']", "#" + $(table.mEditTmpl).attr("id"));
	$.each(tmp, function(key, val) {
		$(val).val("");
	});
	
	// we want to insert a new row before this one
	var tr = $("<tr/>", {
		id: "id_0",
		class: "no_select"
	});
	
	tr.insertBefore(row);
	$(row).hide();
	
	var td = $("<td/>", {
		colspan: Object.keys(table.mHeaders).length,
		style: "text-align: center;"
	});
	tr.append(td);
	
	// and fill in all of the properties, as applies
	var tmp = $("select[id^='edit_tmpl_']", "#" + $(table.mEditTmpl).attr("id"));
	$.each(tmp, function(key, val) {
		// extract the field name from the element ID
		var s = val.id.split("edit_tmpl_");
		
		// get the column type from the headers list
		var info = table.mHeaders[s[1]];
		if (info) {
			if (info.mIsList) {
				// invoke the populate fn on the select element
				info.mListPopulate(val, null, table.mToken);
			}
		}
	});
	
	$(table.mEditTmpl).appendTo(td);
	$(table.mEditTmpl).show();
	
	// hook up the buttons
	$("#cmdDetailEditorCancel").bind("click", {table: table, insertedRow: tr, addNewRow: row}, table.onAddNewCancel);
	$("#cmdDetailEditorSave").bind("click", {table: table, insertedRow: tr, addNewRow: row}, table.onAddNewSave);

	// change state
	table.mState = table.TableState.ADD;
}

EditableTable.prototype.onDetailDelete = function(event) {
	var unitDetail = event.data.unit;
	var table = event.data.table;
	
	if (unitDetail) {
		if (confirm("Are you sure you want to delete unit '" + unitDetail.displayName + "'?")) {
			table.mDelete(table, unitDetail);
		}
	}
}

EditableTable.prototype.onDeleteSucceeded = function(table, unitList) {
	// unhook the buttons
	$("#cmdDetailClose").unbind("click", table.onDetailClose);
	$("#cmdDetailEdit").unbind("click", table.onDetailEdit);
	$("#cmdDetailDelete").unbind("click", table.onDetailDelete);
	
	table.setData(unitList);
	table.show();
	
	table.mState = table.TableState.NORMAL;
}

EditableTable.prototype.onDeleteFailed = function(unit, reason) {
	alert(reason);
}

EditableTable.prototype.onSaveSucceeded = function(table, data) {
	// API returns a list for add-new, and a single unit detail object for an update
	if ($.isArray(data)) {
		$("#cmdDetailEditorCancel").unbind("click", table.onAddNewCancel);
		$("#cmdDetailEditorSave").unbind("click", table.onAddNewSave);
		
		table.setData(data);
		table.show();
		
		table.mState = table.TableState.NORMAL;
	}
	else {
		$("#cmdDetailEditorCancel").unbind("click", table.onDetailEditorCancel);
		$("#cmdDetailEditorSave").unbind("click", table.onDetailEditorSave);
		
		// change back into the detail view
		$(table.mDetailTmpl).show();
		$(table.mEditTmpl).hide();
		
		// update the array element in the table data
		$.each(table.mData, function(idx, val) {
			if (val.id == data.id) {
				table.mData[idx] = data;
			}
		});
		
		// and fill in all of the properties, as applies
		$.each(data, function(key, val) {
			var pattern = "#detail_tmpl_" + key;
			var item = $(pattern);
			if (item.length) {
				item.text(val);
			}
		});
	}
}

EditableTable.prototype.onSaveFailed = function(reason) {
	alert(reason);
}

EditableTable.prototype.setData = function(data) {
	this.mData = data;
}

EditableTable.prototype.setEditable = function(editable) {
	this.mCanEdit = editable;
}

EditableTable.prototype.clear = function() {
	// move the detail and edit rows for safekeeping and delete any table contents
	$(this.mDetailTmpl).appendTo($("body"));
	$(this.mEditTmpl).appendTo($("body"));
	$(this.mDetailTmpl).hide();
	$(this.mEditTmpl).hide();
	$(this.mParent).empty();
}

EditableTable.prototype.show = function() {
	this.clear();
	
	// constructor body code
	var table = $("<table/>", {class: "editable_data_table"});
	var tr = $("<tr/>");
	
	var fields = [];
	$.each(this.mHeaders, function(key, val) {
		var th = $("<th/>");
		
		if (val.mSortable) {
			th.attr("class", "sortable");
		}
		
		th.text(val.mHeaderText)
		th.appendTo(tr);

		fields.push(key);
	});
	
	table.append(tr);
	
	var cb = this.onRowClicked;
	var editTable = this;
	
	$.each(this.mData, function(key, val) {
		// in this case, the 'val' is the object with the data for this row
		var rowId = "id_" + val['id'];
		tr = $("<tr/>", {
			id: rowId
		});
		
		tr.bind("click", {unit: val, table: editTable}, cb);
		
		$.each(fields, function(k, v) {
			var hdr = editTable.mHeaders[v]; 
			if (hdr.mMutator)
				hdr = hdr.mMutator(val, hdr);
			
			if (hdr.mIsLink) {
				var td = $("<td/>");
				var fieldVal = val[v];
				if (fieldVal && fieldVal.length > 0) {
					var a = $("<span/>", {
						class: "pseudo_link"
					});
					
					a.click(function(event) { 
						window.open(fieldVal);
						
						if (event.stopPropagation) event.stopPropagation();
						else event.cancelBubble = true; 
					});
					
					a.text(hdr.mLinkText);
					td.append(a);
				}
				tr.append(td);
			}
			else {
				$("<td/>").text(val[v]).appendTo(tr);
			}
		});
		table.append(tr);
	});
	
	if (this.mCanEdit) {
		var tr = $("<tr/>", {
			class: "no_select",
			id: "id_new"
		});
		
		var td = $("<td/>", {
			colspan: fields.length
		});
		
		var div = $("<div/>", {
			id: "cmdNewUnit"
		});
		
		var cmdAdd = $("<span/>", {
			class: "linkbutton"
		}).text("Add New");
		
		cmdAdd.bind("click", {table: editTable, row: tr}, this.onAddNew);
		
		div.append(cmdAdd);
		td.append(div);
		tr.append(td);
		table.append(tr);
	}

	this.mParent.append(table);
	this.mState = this.TableState.NORMAL;
	this.mCurrentRow = null;
}
