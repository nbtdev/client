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
