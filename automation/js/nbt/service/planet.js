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

var _PlanetService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var mPlanets = {};
    var mColors = {};
    var mLoading = false;

    // quick-lookup tables
    var mPlanetsById = {};

    function PlanetService(aHttp, aRootScope) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
    }

    var updateLookupTables = function(leagueId, planetListing) {
        mPlanetsById[leagueId] = {};

        for (var i=0; i<planetListing.planetGroups.length; ++i) {
            var planetGroup = planetListing.planetGroups[i];

            for (var j=0; j<planetGroup.planets.length; ++j) {
                var planet = planetGroup.planets[j];

                mPlanetsById[leagueId][planet.id] = planet;
            }
        }
    };

    var loadMapColors = function (aLeagueId, aPlanets, aTokenHdr) {
        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: aPlanets._links.mapColors.href,
            headers: aTokenHdr.get()
        }).then(
            function (aResp) {
                mColors[aLeagueId] = aResp.data._embedded;
                rootScope.$broadcast('nbtPlanetsLoaded', aLeagueId, mPlanets[aLeagueId.toString()].planetGroups, mColors[aLeagueId.toString()].mapColors);
            },
            function (aResp) {
                console.log(aResp);
            }
        );
    };

    // load a league's planet listing into the service
    PlanetService.prototype.load = function (aLeague, aToken) {
        if (aLeague) {
            if (!aLeague._links.planetsBySector)
                return;
        }

        if (mLoading)
            return;

        var hdr = new Headers(Header.TOKEN, aToken);

        mLoading = true;

        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: aLeague._links.planetsBySector.href,
            headers: hdr.get()
        }).then(
            function (aResp) {
                mPlanets[aLeague.id] = aResp.data._embedded;
                loadMapColors(aLeague.id, aResp.data, hdr);

                // update quick-lookup tables
                updateLookupTables(aLeague.id, aResp.data._embedded);

                mLoading = false;
            },
            function (aResp) {
                console.log(aResp);
                mLoading = false;
            }
        );
    };

    PlanetService.prototype.get = function (aLeague) {
        if (aLeague)
            return mPlanets[aLeague.id];

        return null;
    };

    PlanetService.prototype.getMapColors = function (aLeague) {
        if (aLeague)
            return mColors[aLeague.id];

        return null;
    };

    PlanetService.prototype.batchUpdatePlanets = function(aLeagueId, aPlanets) {
        for (var k=0; k<aPlanets.length; ++k) {
            var aPlanet = aPlanets[k];

            // update the planet in the primary listing
            for (var i=0; i<mPlanets[aLeagueId].planetGroups.length; ++i) {
                var planetGroup = mPlanets[aLeagueId].planetGroups[i];

                for (var j = 0; j < planetGroup.planets.length; ++j) {
                    var planet = planetGroup.planets[j];

                    if (planet.id === aPlanet.id) {
                        planetGroup.planets[j] = aPlanet;
                        break;
                    }
                }
            }

            // update any additional lookup tables
            mPlanetsById[aLeagueId][planet.id] = aPlanet;
        }

        // notify all listeners that their planet data changed
        rootScope.$broadcast('nbtPlanetsLoaded', aLeagueId, mPlanets[aLeagueId].planetGroups, mColors[aLeagueId].mapColors);
    };

    PlanetService.prototype.updatePlanet = function(aPlanet, aToken, aSuccess, aFail) {
        if (aPlanet) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aPlanet._links.self.href,
                data: aPlanet,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccess) aSuccess(aResp.data);
                },
                function (aErr) {
                    if (aFail) aFail(aErr.data);
                }
            );
        }
    };

    PlanetService.prototype.editPlanets = function(aLeagueId, planetEdits, pushToRemote) {
        if (!aLeagueId)
            return;

        var leaguePlanets = mPlanets[aLeagueId];
        var editedPlanets = {};

        // make the indicated edits...
        for (var i=0; i<planetEdits.length; ++i) {
            var planetEdit = planetEdits[i];

            var planet = mPlanetsById[aLeagueId][planetEdit.planetId];
            planet[planetEdit.property] = planetEdit.newValue;

            editedPlanets[planet.id] = planet;
        }

        // ...and if the caller desires, push the changes to the API
        if (pushToRemote) {
        }

        // regardless, notify all listeners that their planet data changed
        rootScope.$broadcast('nbtPlanetsLoaded', aLeagueId, mPlanets[aLeagueId].planetGroups, mColors[aLeagueId].mapColors);
    };

    PlanetService.prototype.fetchPlanetDetail = function (aPlanet, aToken, aCallback) {
        if (aPlanet && aPlanet._links.brief) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.brief.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback) {
                        aResp.data.parentGroup = aPlanet.parentGroup;
                        aCallback(aResp.data);
                    }
                }
            );
        }
    };

    PlanetService.prototype.fetchSectorDetail = function (aSector, aToken, aCallback) {
        if (aSector) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aSector._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback) {
                        aCallback(aResp.data);
                    }
                }
            );
        }
    };

    PlanetService.prototype.fetchCombatUnitsOnPlanet = function (aPlanet, aToken, aCallback) {
        if (aPlanet && aPlanet._links.unitInstances) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.unitInstances.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback)
                        aCallback(aResp.data._embedded.combatUnitInstances);
                }
            );
        }
    };

    PlanetService.prototype.fetchFactories = function (aPlanet, aToken, aCallback) {
        if (aPlanet && aPlanet._links.factories) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.factories.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback)
                        aCallback(aResp.data);
                }
            );
        }
    };

    PlanetService.prototype.addFactory = function (aPlanet, aFactory, aToken, aCallback, aFail) {
        if (aPlanet && aPlanet._links.factories) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aPlanet._links.factories.href,
                data: aFactory,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback) aCallback(aResp.data);
                },
                function (aErr) {
                    if (aFail) aFail(aErr.data);
                }
            );
        }
    };

    PlanetService.prototype.updateFactory = function (aFactory, aToken, aCallback, aFail) {
        if (aFactory && aFactory._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aFactory._links.self.href,
                data: aFactory,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback) aCallback(aResp.data);
                },
                function (aErr) {
                    if (aFail) aFail(aErr.data);
                }
            );
        }
    };

    PlanetService.prototype.deleteFactory = function (aFactory, aToken, aCallback, aFail) {
        if (aFactory && aFactory._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'DELETE', // TODO: GET FROM LINKS!
                url: aFactory._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback) aCallback(aResp.data);
                },
                function (aErr) {
                    if (aFail) aFail(aErr.data);
                }
            );
        }
    };

    PlanetService.prototype.createSector = function(aFaction, aPlanetIds, aToken, aSuccessCb, aFailCb) {
        if (aFaction._links.sectors) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aFaction._links.sectors.href,
                data: aPlanetIds,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp);
                },
                function(aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    PlanetService.prototype.deleteSectors = function(aSectorsDict, aToken, aSuccessCb, aFailCb) {
        var hdr = new Headers(Header.TOKEN, aToken);

        Object.keys(aSectorsDict).forEach(function(key) {
            var group = aSectorsDict[key];

            http({
                method: 'DELETE', // TODO: GET FROM LINKS!
                url: group._links.sector.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(group.sectorId);
                },
                function(aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        });
    };

    return PlanetService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtPlanet', ['$http', '$rootScope', function($http, $rootScope) {
        return new _PlanetService($http, $rootScope);
    }]);
})();