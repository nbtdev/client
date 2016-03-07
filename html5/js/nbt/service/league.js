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
var _League = (function() {
    var mId = -1;
    var mName = null;
    var mSelfLink = null;
    var mProfileLink = null;
    var mPlanetsLink = null;

    function League(aInit) {
        if (aInit) {
            mId = aInit.id ? aInit.id : -1;
            mName = aInit.name ? aInit.name : null;
            mSelfLink = aInit.self ? aInit.self : null;
            mProfileLink = aInit.profile ? aInit.profile : null;
            mPlanetsLink = aInit.planets ? aInit.planets : null;
        }
    }

    League.prototype = {
        isValid: function () {
            return mId > 0;
        },

        name: function () {
            return mName;
        },

        selfLink: function () {
            return mSelfLink;
        },

        profileLink: function () {
            return mProfileLink;
        },

        planetsLink: function () {
            return mPlanetsLink;
        },

        id: function () {
            return mId;
        },

        update : function(aDetails) {
            if (aDetails) {
                mId = aDetails.id ? aDetails.id : mId;
                mName = aDetails.name ? aDetails.name : mName;
                mSelfLink = aDetails.self ? aDetails.self : mSelfLink;
                mProfileLink = aDetails.profile ? aInit.profile : mProfileLink;
                mPlanetsLink = aDetails.planets ? aInit.planets : mPlanetsLink;
            }
        },
    };

    return League;
})();

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
    };

    var save = function () {
        if (mCurrentLeague)
            localStorage.setItem('league', mCurrentLeague.id());
        else
            clear();
    };

    var setLeagues = function (aLeagues) {
        mLeagues = [];

        for (var i = 0; i < aLeagues.length; ++i) {
            var l = aLeagues[i];

            mLeagues.push(new _League({
                id: l.id,
                name: l.name,
                planets: l._links.planets,
                profile: l._links.profile,
                this: l._links.this
            }));
        }
    };

    var updateCurrentLeagueDetails = function(aDetails) {
        mCurrentLeague.update(aDetails);
    };

    LeagueService.prototype.fetchLeagues = function (aToken) {
        var hdrs = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: get from links!
            url: nbtRoot.links().leagues.href,
            headers: hdrs.get()
        }).then(function (resp) {
            var currentId = parseInt(localStorage.league);
            setLeagues(resp.data._embedded.leagues);
            self.setCurrent(currentId);

            rootScope.$broadcast('nbtLeaguesChanged', mLeagues);
        });
    };

    LeagueService.prototype.setCurrent = function (aLeagueId, aToken) {
        // prevent infinite recursion
        if (mCurrentLeague && mCurrentLeague.id() === aLeagueId)
            return;

        if (mLeagues) {
            mCurrentLeague = null;

            // change the current league by ID
            for (var i = 0; i < mLeagues.length; ++i) {
                var l = mLeagues[i];
                if (l.id() === aLeagueId) {
                    mCurrentLeague = l;
                    break;
                }
            }

            // only call out if the league does not already have the extra details
            if (mCurrentLeague && mCurrentLeague.profile === null) {
                var hdrs = new Headers(Header.TOKEN, aToken);

                http({
                    method: 'GET',
                    url: mCurrentLeague.self.href,
                    headers: hdrs.get()
                }).then(function (resp) {
                    var leagueDetails = resp.data;

                    // update the current league with additional detail
                    updateCurrentLeagueDetails(leagueDetails);

                    rootScope.$broadcast('nbtLeagueChanged', self.current());
                });
            }
        }

        save();
    };

    LeagueService.prototype.current = function () {
        // if we have a league list, but not a current league,
        // try to identify one from the localStorage.league
        // value (if present)
        if (!mCurrentLeague) {
            if (mLeagues) {
                for (var i = 0; i < mLeagues.length; ++i) {
                    var l = mLeagues[i];
                    if (l.id() === parseInt(localStorage.league)) {
                        mCurrentLeague = l;
                        break;
                    }
                }
            }
        }

        return mCurrentLeague;
    };

    LeagueService.prototype.leagues = function () {
        return mLeagues;
    };

    LeagueService.prototype.delete = function () {
        // not implemented yet
    };

    LeagueService.prototype.add = function (aLeagueDef, aSuccess, aFailure) {
        // not implemented yet
    };

    LeagueService.prototype.update = function (aSuccess, aFailure) {
        // not implemented yet
    };

    LeagueService.prototype.reset = function () {
        clear();
        fetchLeagues();
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