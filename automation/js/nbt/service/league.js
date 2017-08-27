/**
 Copyright (c) 2016, Netbattletech
 All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are
 permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
 OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var _LeagueService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var nbtRoot = null;

    // current league object
    var mCurrentLeague = null;

    // list of leagues from the automation
    var mLeagues = null;

    // actual c'tor
    function LeagueService(aHttp, aRootScope, aNbtRoot) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
        nbtRoot = aNbtRoot;
    }

    var clear = function () {
        mCurrentLeague = null;

        // clear local storage too
        localStorage.removeItem('league');
        localStorage.removeItem('nbtCurrentLeagueId');
        localStorage.removeItem('nbtLeagues');
    };

    clear();

    var updateCurrentLeagueDetails = function(aDetails) {
        mCurrentLeague.update(aDetails);
    };

    var setLeagues = function (aLeagues) {
        mLeagues = [];

        for (var i = 0; i < aLeagues.length; ++i) {
            var l = aLeagues[i];

            var league = {
                id: l.id,
                name: l.name,
                logo: l.logo,
                logoSmall: l.logoSmall,
                _links: {
                    planets: l._links.planetsBySector,
                    profile: l._links.profile,
                    factions: l._links.factions,
                    userProfile: l._links.userProfile,
                    self: l._links.self
                }
            };

            var newLeague = new _League(league);
            mLeagues.push(newLeague);
        }
    };

    LeagueService.prototype.fetchLeagues = function (aToken, aSuccessCb) {
        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: get from links!
            url: nbtRoot.links().leagues.href,
            headers: hdrs.get()
        }).then(function (resp) {
            setLeagues(resp.data._embedded.leagues);

            if (aSuccessCb) {
                aSuccessCb(mLeagues, resp.data._embedded.leagues);
            }

            rootScope.$broadcast('nbtLeaguesChanged', mLeagues, resp.data._embedded.leagues);
        });
    };

    LeagueService.prototype.first = function() {
        if (mLeagues && mLeagues.length > 0) {
            return mLeagues[0];
        }

        return null;
    };

    LeagueService.prototype.leagues = function () {
        return mLeagues;
    };

    LeagueService.prototype.remove = function () {
        // not implemented yet
    };

    LeagueService.prototype.add = function (aLeagueDef, aSuccess, aFailure) {
        // not implemented yet
    };

    LeagueService.prototype.update = function (aSuccess, aFailure) {
        // not implemented yet
    };

    LeagueService.prototype.fetchLeagueProfile = function(aLeague, aToken, aSuccessCb, aFailCb) {
        if (!aLeague)
            return;

        if (!aLeague._links.userProfile)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: get from links!
            url: aLeague._links.userProfile.href,
            headers: hdrs.get()
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb(resp);
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err);
            }
        );
    };

    LeagueService.prototype.updateApplication = function(aLeague, aApplicationData, aToken, aSuccessCb, aFailCb) {
        if (!aApplicationData._links.self)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'PUT', // TODO: get from links!
            url: aApplicationData._links.self.href,
            headers: hdrs.get(),
            data: {
                application: aApplicationData
            }
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb(resp);
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err);
            }
        );
    };

    // NOTE: this call only succeeds if the API determines that aToken has the proper access to approve applications...otherwise,
    // you are wasting your time trying to make this call.
    LeagueService.prototype.approveApplication = function(aLeague, aApplicationData, aResetFaction, aToken, aSuccessCb, aFailCb) {
        if (!aApplicationData._links.self)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'PUT', // TODO: get from links!
            url: aApplicationData._links.self.href,
            headers: hdrs.get(),
            data: {
                application: aApplicationData,
                approved: true,
                resetFaction: aResetFaction
            }
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb(resp.data);
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err);
            }
        );
    };

    LeagueService.prototype.runPayroll = function(aLeague, aData, aToken, aSuccessCb, aFailCb) {
        if (!aLeague._links.jobs)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'POST', // TODO: get from links!
            url: aLeague._links.jobs.href,
            headers: hdrs.get(),
            data: aData
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb(resp.data);
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err.data);
            }
        );
    };

    LeagueService.prototype.fetchAlerts = function(aLeague, aToken, aSuccessCb, aFailCb) {
        if (!aLeague._links.alerts)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: get from links!
            url: aLeague._links.alerts.href,
            headers: hdrs.get()
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb(resp.data);
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err);
            }
        );
    };

    LeagueService.prototype.dismissAlert = function(aAlert, aToken, aSuccessCb, aFailCb) {
        if (!aAlert._links.self)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'DELETE', // TODO: get from links!
            url: aAlert._links.self.href,
            headers: hdrs.get()
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb(resp.data);
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err);
            }
        );
    };

    LeagueService.prototype.fetchApplications = function(aLeague, aToken, aSuccessCb, aFailCb) {
        if (!aLeague._links.applications)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: get from links!
            url: aLeague._links.applications.href,
            headers: hdrs.get()
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb(resp.data);
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err);
            }
        );
    };

    LeagueService.prototype.cancelApplication = function(aLeague, aApplicationData, aToken, aSuccessCb, aFailCb) {
        if (!aApplicationData._links.self)
            return;

        // fetch the leagues from the service
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'DELETE', // TODO: get from links!
            url: aApplicationData._links.self.href,
            headers: hdrs.get()
        }).then(
            function (resp) {
                if (aSuccessCb)
                    aSuccessCb();
            },
            function (err) {
                if (aFailCb)
                    aFailCb(err);
            }
        );
    };

    return LeagueService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtLeague', ['$http', '$rootScope', 'nbtRoot', function($http, $rootScope, nbtRoot) {
        var ls = new _LeagueService($http, $rootScope, nbtRoot);
        return ls;
    }]);
})();