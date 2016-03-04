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

    mod.service('nbtLeague', ['$http', '$rootScope', 'nbtRoot', 'nbtToken', 'nbtUser', function($http, $rootScope, nbtRoot, nbtToken, nbtUser) {
        // current league object
        var mCurrentLeague = null;

        // list of leagues from the automation
        var mLeagues = null;

        var clear = function() {
            mCurrentLeague = null;

            // clear local storage too
            localStorage.removeItem('league');
        };

        var fetchLeagues = function() {
            $http({
                method: 'GET', // TODO: get from links!
                url: nbtRoot.links().leagues.href,
                headers: {
                    'X-NBT-Token': nbtToken.current()
                }
            }).then(function(resp) {
                var currentId = localStorage.league;
                mLeagues = resp.data._embedded.leagues;

                // go through the leagues and pick the one that is 'current', if any
                for (var i=0; i<mLeagues.length; ++i) {
                    var l = mLeagues[i];

                    if (l.id === currentId) {
                        mCurrentLeague = l;
                        break;
                    }
                }
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
                    $http({
                        method: 'GET',
                        url: mCurrentLeague._links.self.href,
                        headers: {
                            'X-NBT-Token': nbtToken.current()
                        }
                    }).then(function(resp) {
                        mCurrentLeague = resp.data;
                        nbtUser.onLeagueChanged(mCurrentLeague);
                        $rootScope.$broadcast('nbtLeagueChanged', mCurrentLeague);
                    });
                }
            }
        };

        this.current = function() {
            if (mCurrentLeague) {
                return {
                    name: mCurrentLeague.name,
                    id: mCurrentLeague.id
                };
            }

            return null;
        };

        this.leagues = function() {
            var rtn = [];

            for (var i=0; i<mLeagues.length; ++i) {
                var l = mLeagues[i];

                var _l = {
                    name: l.name,
                    id: l.id
                };

                rtn.push(_l);
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
                    $http({
                        method: 'DELETE', // TODO: get this from the links!
                        url: mCurrentLeague._links.delete.href,
                        headers: {
                            'X-NBT-Token': nbtToken.current()
                        }
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

        fetchLeagues();
    }]);
})();