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

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtLeague', ['$http', '$rootScope', 'nbtRoot', 'nbtIdentity', function($http, $rootScope, nbtRoot, nbtIdentity) {
        var self = this;

        // current league object
        var mCurrentLeague = null;

        // list of leagues from the automation
        var mLeagues = null;

        var clear = function() {
            mCurrentLeague = null;

            // clear local storage too
            localStorage.removeItem('league');
        };

        var save = function() {
            if (mCurrentLeague)
                localStorage.setItem('league', mCurrentLeague.id);
            else
                clear();
        };

        var fetchLeagues = function() {
            var hdrs = new Headers(Header.TOKEN, nbtIdentity.get().token);

            $http({
                method: 'GET', // TODO: get from links!
                url: nbtRoot.links().leagues.href,
                headers: hdrs.get()
            }).then(function(resp) {
                var currentId = parseInt(localStorage.league);
                mLeagues = resp.data._embedded.leagues;

                $rootScope.$broadcast('nbtLeaguesChanged', mLeagues);

                self.setCurrent(currentId);
            });
        };

        this.setCurrent = function(aLeagueId) {
            // prevent infinite recursion
            if (mCurrentLeague && mCurrentLeague.id === aLeagueId)
                return;

            if (mLeagues) {
                mCurrentLeague = null;

                // change the current league by ID
                for (var i = 0; i < mLeagues.length; ++i) {
                    var l = mLeagues[i];
                    if (l.id === aLeagueId) {
                        mCurrentLeague = l;
                        break;
                    }
                }

                if (mCurrentLeague) {
                    var hdrs = new Headers(Header.TOKEN, nbtIdentity.get().token);

                    $http({
                        method: 'GET',
                        url: mCurrentLeague._links.self.href,
                        headers: hdrs.get()
                    }).then(function(resp) {
                        mCurrentLeague = resp.data;
                        nbtIdentity.onLeagueChanged(mCurrentLeague);
                        $rootScope.$broadcast('nbtLeagueChanged', mCurrentLeague);
                    });
                }
            }

            save();
        };

        this.current = function() {
            // if we have a league list, but not a current league,
            // try to identify one from the localStorage.league
            // value (if present)
            if (!mCurrentLeague) {
                if (mLeagues) {
                    for (var i=0; i<mLeagues.length; ++i) {
                        var l = mLeagues[i];
                        if (l.id === parseInt(localStorage.league)) {
                            mCurrentLeague = l;
                            break;
                        }
                    }
                }
            }

            if (mCurrentLeague) {
                return {
                    name: mCurrentLeague.name,
                    id: mCurrentLeague.id,
                    planets: mCurrentLeague._links.planets
                };
            }

            return {
                name: null,
                id: -1,
                planets: null
            };
        };

        this.leagues = function() {
            var rtn = [];

            if (mLeagues) {
                for (var i = 0; i < mLeagues.length; ++i) {
                    var l = mLeagues[i];

                    var _l = {
                        name: l.name,
                        id: l.id,
                        planets: l._links.planets
                    };

                    rtn.push(_l);
                }
            }

            return rtn;
        };

        this.name = function() {
            if (mCurrentLeague) {
                return mCurrentLeague.name;
            }

            return null;
        };

        this.description = function() {
            if (mCurrentLeague) {
                return '';
            }

            return null;
        };

        this.setName = function(aName) {
            // not implemented yet
        };

        this.setDescription = function(aDesc) {
            // not implemented yet
        };

        this.delete = function() {
            if (mCurrentLeague) {
                if (mCurrentLeague._links.delete) {
                    // remove the league from the database
                    var hdrs = new Headers(Header.TOKEN, nbtIdentity.get().token);

                    $http({
                        method: 'DELETE', // TODO: get this from the links!
                        url: mCurrentLeague._links.delete.href,
                        headers: hdrs.get()
                    });

                    clear();
                }
            }
        };

        this.add = function(aLeagueDef, aSuccess, aFailure) {
            // not implemented yet
        };

        this.update = function(aSuccess, aFailure) {
            // not implemented yet
        };

        this.reset = function() {
            clear();
            fetchLeagues();
        };

        fetchLeagues();
    }]);
})();