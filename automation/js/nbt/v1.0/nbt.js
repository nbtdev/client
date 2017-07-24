function NBT(token, leagueId) 
{
	this.mUrlPrefix = "http://";
	this.mUrlPort = 8080;
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

	this.call = function(hostname, resource, resourceId) 
	{
        var rtn = this.mUrlPrefix + hostname + ":" + this.mUrlPort;
		
        if (resource !== null) {
			rtn += "/" + resource;
		}
		
        if (resourceId !== null) {
			rtn += "/" + resourceId;
		}
		
		return rtn;
	};
	
	/**
	 * Return all active leagues. If token is not null and access level
	 * is League Admin or greater, inactive leagues and leagues in development
	 * will also be returned.
	 */
    this.getLeagues = function(cbSuccess, cbErr) {
		// token may be null for this
		var strToken = null;
		
		if (this.mToken) {
			//strToken = JSON.stringify(this.mToken);
			strToken = this.mToken.value;
		}
		
		$.ajax({
			url: this.call(location.hostname, "leagues"),
			type: "GET",
			headers: {"X-NBT-Token": strToken}
		}).error(function (errText) {
			cbErr(errText); 
		}).success(function(resp) {
			if (resp.error === true)
				cbErr(resp.message);
			else {
				cbSuccess(resp.data);
			}
		});
		
		return null;
	};

    /**
     * Return planets for specified league. Returns an object of type "StarmapData" through cbSuccess
     */
    this.getPlanets = function(leagueId, cbSuccess, cbErr) {
        // league ID may not be null
        if (leagueId === null) {
            return false;
        }

        // token may be null for this
        var strToken = null;

        if (this.mToken) {
            //strToken = JSON.stringify(this.mToken);
            strToken = this.mToken.value;
        }

        $.ajax({
            url: this.call(location.hostname, "leagues/" + leagueId + "/planets"),
            type: "GET",
            headers: {"X-NBT-Token": strToken}
        }).error(function (errText) {
            cbErr(errText);
        }).success(function(resp) {
            if (resp.error === true)
                cbErr(resp.message);
            else {
                cbSuccess(resp.data);
            }
        });

        return true;
    };
}

function renderLoginBox(parent) {
    // <div style="text-align: right">Username:&nbsp;<input type="text" id="txtUsername" size="15" /></div>
    // <div style="text-align: right">Password:&nbsp;<input type="password" id="txtPassword" size="15" /></div>
    // <div style="text-align: right; margin-top: 3px;"><input type="button" value="Login" onclick="onLogin(document.getElementById('login'), document.getElementById('txtUsername'), document.getElementById('txtPassword'))" /></div>
	var div = $("<div/>").attr("style", "text-align: right");
	div.text("Username: ");
	var input = $("<input/>").attr("type", "text").attr("id", "txtUsername").attr("size", "15");
	input.appendTo(div);
	div.appendTo(parent);

	div = $("<div/>").attr("style", "text-align: right");
	div.text("Password: ");
	input = $("<input/>").attr("type", "password").attr("id", "txtPassword").attr("size", "15");
	input.appendTo(div);
	div.appendTo(parent);

	div = $("<div/>").attr("style", "text-align: right; margin-top: 3px;");
	input = $("<input/>").attr("type", "button").attr("value", "Login").click(function() {
		onLogin($("#login"), $("#txtUsername"), $("#txtPassword"));
	});
	
	input.appendTo(div);
	div.appendTo(parent);
}


function layoutLeagues(leagues) {
	// "leagues" is an object, with attributes "data" and "links"
	// "data" in this case is also an object, with attrs "description", "items" and "self"
	//		"description" is text describing the object
	//		"items" is an array of objects, each one a "League"
	//			League object will have displayName, leagueId and status, and a "self" link that contains the href to the root URL for this League, and 
	//			a "banner" link that points to the image to be used for the league's banner logo
	//		"self" is a Link object that points to this href
	// "links" will have at least "parent", plus any additional state transitions valid for this user
	// (for instance, "add" to add a new league to this collection)
	if (leagues !== null) {
		var data = leagues.data;
		if (data !== null) {
			var leagueItems = data.items;
			if (leagueItems !== null) {
				for (var i=0; i<leagueItems.length; ++i) {
					var l = leagueItems[i];
					
					// add an entry to the "leagues" div for this league
					var bannerUrl = null;
					var leagueUrl = null;
					
					if (l.banner !== null) {
						bannerUrl = l.banner.href;
					}
					
					if (l.self !== null) {
						leagueUrl = l.self.href;
					}
					
					var leagueName = l.displayName;
					
					var ldiv = $("<div/>").attr("class", "league");
					var img = $("<img/>").attr("src", bannerUrl).attr("title", leagueName);
					img.appendTo(ldiv);
					ldiv.appendTo("#leagues");
					
					img.click(leagueUrl, onSelectLeague);
				}
			}
		}
	}
}

function onSelectLeague(leagueUrl) {
    $.ajax({
        url: leagueUrl.data,
        type: leagueUrl.method
    }).success(function(resp) {
    	var b = $("body");
    	b.empty();
    	var lbox = $("<div/>").attr("class", "login").attr("id", "loginBox");
    	lbox.appendTo(b);
    	renderLoginBox(lbox);
    	
    	var league = resp.data;
    	var links = resp.links;
    	
    	if (league !== null) {
	    	// header container
	    	var hdr = $("<div/>").attr("class", "header").attr("id", "pageHeader");
	    	hdr.appendTo(b);
	    	
	    	// container for middle items
	    	var middle = $("<div/>");
	    	middle.appendTo(b);
	    	
	    	// menu container
	    	var menu = $("<div/>").attr("class", "menu").attr("id", "pageMenu");
	    	menu.appendTo(middle);
	    	
	    	// main content container
	    	var content = $("<div/>").attr("class", "content").attr("id", "pageContent");
	    	content.appendTo(middle);

	    	// footer container
	    	var footer = $("<div/>").attr("class", "footer").attr("id", "pageFooter");
	    	footer.appendTo(b);

	    	// put things in these containers
	    	leagueHeader(hdr, league);

	    	// render clickable links
	    	for (var i=0; i<links.length; ++i) {
	    		var link = links[i];
	    		
	    		if (link !== null) {
	    			if (link.rel === "planets")
	    				leagueLink(menu, link);
	    		}
	    	}
	    	
	    	leagueFooter(footer, league);
    	}
    });
}

function leagueLink(parent, link) {
	var item = $("<div/>").attr("class", "menuItem").text(link.text).click(link, onSelectMenuItem);
	item.appendTo(parent);
}

function leagueHeader(parent, league) {
	// banner at the top
	var banner = $("<img/>").attr("src", league.banner.href);
	banner.appendTo(parent);
}

function leagueFooter(parent, league) {
	
}

function onSelectMenuItem(linkData) {
	var link = linkData.data;

	if (link.rel === "planets") {
		// check for WebGL before sending the request
		if (window.WebGLRenderingContext === null) {
			alert("Your browser must support the HTML5 Canvas and WebGL features to use the starmap");
			return;
		}
	}
	
    $.ajax({
        url: link.href,
        type: link.method
    }).success(function(resp) {
    	if (link.rel === "planets") {
	    	var starmapData = resp;
	    	
	    	var content = $("#pageContent");
	    	content.empty();
	    	
	    	// put the starmap in "content"
	    	// <canvas style="display: none;" class="starmap" id="starmapContext" width="800" height="600">
	    	//     "Your browser must have HTML5 Canvas and WebGL support to use the starmap"
	    	// </canvas>
	    	// <div id="starmapOverlay" class="starmapOverlay" style="display: none;"></div>
	    	// <div id="starmapUI" class="starmapUI" style="display: none;"></div>
	    	var canvas = $("<canvas/>").attr("class", "starmap_old").attr("id", "starmapContext").attr("width", "800").attr("height", "600").text("Your browser must have HTML5 Canvas and WebGL support to use the starmap");
	    	var overlay = $("<div/>").attr("class", "starmapOverlay").attr("id", "starmapOverlay");
	    	var ui = $("<div/>").attr("class", "starmapUI").attr("id", "starmapUI");
	    	
	    	starmap = new Starmap(starmapData.data, canvas[0], overlay[0], ui[0]);
	    	
	    	// find the "mapColors" links in resp.links
	    	var mapColors = null;
	    	for (var i=0; i<resp.links.length; ++i) {
	    		if (resp.links[i].rel === "mapColors") {
	    			mapColors = resp.links[i].href;
	    			break;
	    		}
	    	}
	    	
			starmap.init({
				container: content, 
				mapColors: mapColors,
				_this: starmap
			});
	    }
    });
}

var starmap = null;