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
        restore();
    }

    var clear = function () {
        mCurrentLeague = null;

        // clear local storage too
        localStorage.removeItem('nbtCurrentLeagueId');
        localStorage.removeItem('nbtLeagues');
    };

    var save = function () {
        if (mCurrentLeague)
            localStorage.setItem('nbtCurrentLeagueId', mCurrentLeague.id());
        else
            localStorage.removeItem('nbtCurrentLeagueId');

        if (mLeagues && mLeagues.length > 0) {
            var leagues = [];

            for (var i=0; i<mLeagues.length; ++i) {
                var l = mLeagues[i];
                leagues.push({
                    id: l.id(),
                    name: l.name(),
                    logo: l.logo(),
                    logoSmall: l.logoSmall(),
                    _links : {
                        planets: l.planetsLink(),
                        factions: l.factionsLink(),
                        profile: l.profileLink(),
                        userProfile: l.userProfileLink(),
                        self: l.selfLink()
                    }
                });
            }

            localStorage.setItem('nbtLeagues', JSON.stringify(leagues));
        } else {
            localStorage.removeItem('nbtLeagues');
        }
    };

    var restore = function() {
        var currentLeagueId = 0;
        mLeagues = null;
        mCurrentLeague = null;

        if (localStorage.nbtCurrentLeagueId)
            currentLeagueId = localStorage.nbtCurrentLeagueId;

        if (localStorage.nbtLeagues) {
            leagues = JSON.parse(localStorage.nbtLeagues);
            mLeagues = [];

            for (var i=0; i<leagues.length; ++i) {
                var league = new _League(leagues[i]);

                if (league.id() === currentLeagueId)
                    mCurrentLeague = league;

                mLeagues.push(league);
            }

            if (!mCurrentLeague) {
                mCurrentLeague = mLeagues[0];

                // re-save because this may have changed the current league cached value
                save();
            }

            rootScope.$broadcast('nbtLeaguesChanged', mLeagues, mCurrentLeague);        }
    };

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

        save();
    };

    LeagueService.prototype.fetchLeagues = function (aToken) {
        // first try to restore cached data from local storage
        restore();

        // a null mLeagues member indicates that
        if (!mLeagues) {
            // fetch the leagues from the service
            var hdrs = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: get from links!
                url: nbtRoot.links().leagues.href,
                headers: hdrs.get()
            }).then(function (resp) {
                var currentId = parseInt(localStorage.league);
                setLeagues(resp.data._embedded.leagues);
                self.setCurrent(currentId);

                rootScope.$broadcast('nbtLeaguesChanged', mLeagues, mCurrentLeague);
            });
        }
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
            if (mCurrentLeague && mCurrentLeague.profileLink() === null) {
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

        if (!mCurrentLeague) {
            if (mLeagues) {
                mCurrentLeague = mLeagues[0];
                localStorage.setItem('league', 0);
            }
        }

        return mCurrentLeague;
    };

    LeagueService.prototype.get = function(id) {
        if (mLeagues) {
            for (var i = 0; i < mLeagues.length; ++i) {
                var l = mLeagues[i];
                if (l.id() === id) {
                    return l;
                }
            }
        }

        return null;
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

    LeagueService.prototype.reset = function () {
        clear();
        fetchLeagues();
    };

    LeagueService.fetchLeagueData = function(league) {

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