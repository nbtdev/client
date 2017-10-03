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

var _FactionService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var mFactions = {};
    var mClasses = [];
    var mStatuses = [];

    function FactionService(aHttp, aRootScope) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
    }

    FactionService.prototype.fetchFactionDetail = function(aFaction, aToken, aSuccessCb) {
        if (aFaction && aFaction._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                }
            );
        }
    };

    FactionService.prototype.fetchFactionBattles = function(aFaction, activeOnly, aToken, aSuccessCb) {
        if (aFaction && aFaction._links.battles) {
            var hdr = new Headers(Header.TOKEN, aToken);
            var url = aFaction._links.battles.href;

            if (!activeOnly)
                url += '?active=false';

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: url,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                }
            );
        }
    };

    FactionService.prototype.deleteFaction = function(aFaction, aToken, aSuccessCb, aFailCb) {
    };

    FactionService.prototype.updateFaction = function(aFaction, aToken, aSuccessCb, aFailCb) {
        if (aFaction && aFaction._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aFaction._links.self.href,
                data: aFaction,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.fetchFactionSetup = function(aFaction, aToken, aSuccessCb) {
        if (aFaction && aFaction._links.setup) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.setup.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                }
            );
        }
    };

    FactionService.prototype.submitFactionSetup = function(aFaction, aData, aToken, aSuccessCb, aFailCb) {
        if (aFaction && aFaction._links.setup) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aFaction._links.setup.href,
                data: aData,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.fetchFactionsForLeague = function(aLeague, aToken, aSuccessCb) {
        if (aLeague._links.factions) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aLeague._links.factions.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    // populate faction database with response
                    var factions = aResp.data._embedded.factionExes;
                    mFactions[aLeague.id] = factions;

                    // trigger a load of faction classes and statuses too; the links will be sent with the factions collection
                    http({
                        method: 'GET', // TODO: GET FROM LINKS!
                        url: aResp.data._links.classes.href,
                        headers: hdr.get()
                    }).then(
                        function(resp) {
                            rootScope.$broadcast('nbtFactionClassesChanged', resp.data);
                        }
                    );

                    http({
                        method: 'GET', // TODO: GET FROM LINKS!
                        url: aResp.data._links.statuses.href,
                        headers: hdr.get()
                    }).then(
                        function(resp) {
                            rootScope.$broadcast('nbtFactionStatusesChanged', resp.data);
                        }
                    );

                    if (aSuccessCb)
                        aSuccessCb(factions);
                }
            );
        }
    };

    FactionService.prototype.apply = function(aFaction, aData, aToken, aSuccessCb, aFailCb) {
        if (aFaction._links.apply) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aFaction._links.apply.href,
                data: aData,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp);
                }
            );
        }
    };

    FactionService.prototype.transferPlanetsToFaction = function(aFaction, aPlanetIds, aToken, aSuccessCb, aFailCb) {
        if (aFaction._links.planets) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aFaction._links.planets.href,
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

    FactionService.prototype.fetchFactories = function(aFaction, aToken, aSuccessCb) {
        if (aFaction && aFaction._links.factories) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.factories.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                }
            );
        }
    };

    FactionService.prototype.fetchRoster = function(aFaction, aToken, aSuccessCb) {
        if (aFaction && aFaction._links.roster) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.roster.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                }
            );
        }
    };

    FactionService.prototype.fetchPlanets = function(aFaction, aToken, aSuccessCb) {
        if (aFaction && aFaction._links.planets) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.planets.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                }
            );
        }
    };

    FactionService.prototype.addPilotsToRoster = function(aFaction, aPilots, aToken, aSuccessCb, aFailCb) {
        if (!(aPilots instanceof Array)) {
            aFailCb({data: { message: "Expected an array of Pilot instances"}});
            return;
        }

        if (aFaction && aFaction._links.roster) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aFaction._links.roster.href,
                data: aPilots,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.updateRosterPilot = function(aPilot, aToken, aSuccessCb, aFailCb) {
        if (aPilot && aPilot._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aPilot._links.self.href,
                data: aPilot,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.extendInvite = function(aFaction, aInvitee, aToken, aSuccessCb, aFailCb) {
        if (aFaction && aFaction._links.invitations) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aFaction._links.invitations.href,
                data: aInvitee,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.acceptInvite = function(aAlert, aToken, aSuccessCb, aFailCb) {
        if (aAlert && aAlert._links.reference) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aAlert._links.reference.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.declineInvite = function(aAlert, aToken, aSuccessCb, aFailCb) {
        if (aAlert && aAlert._links.reference) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'DELETE', // TODO: GET FROM LINKS!
                url: aAlert._links.reference.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.removePilotFromRoster = function(aPilot, aToken, aSuccessCb, aFailCb) {
        if (aPilot && aPilot._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'DELETE', // TODO: GET FROM LINKS!
                url: aPilot._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr);
                }
            );
        }
    };

    FactionService.prototype.fetchLedger = function(aFaction, aToken, aSuccessCb, aFailCb) {
        if (aFaction && aFaction._links.ledger) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.ledger.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr.data);
                }
            );
        }
    };

    FactionService.prototype.fetchDiplomacyData = function(aFaction, aToken, aSuccessCb, aFailCb) {
        if (aFaction && aFaction._links.alliances) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.alliances.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr.data);
                }
            );
        }
    };

    FactionService.prototype.submitFactoryOrder = function(aFactory, aQty, aToken, aSuccessCb, aFailCb) {
        if (aFactory && aFactory._links.factoryOrders) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aFactory._links.factoryOrders.href,
                data: aQty,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr.data);
                }
            );
        }
    };

    FactionService.prototype.transferFunds = function(aFaction, aTransaction, aToken, aSuccessCb, aFailCb) {
        if (aFaction && aFaction._links.ledger) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aFaction._links.ledger.href,
                headers: hdr.get(),
                data: aTransaction
            }).then(
                function (aResp) {
                    if (aSuccessCb)
                        aSuccessCb(aResp.data);
                },
                function (aErr) {
                    if (aFailCb)
                        aFailCb(aErr.data);
                }
            );
        }
    };

    return FactionService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtFaction', ['$http', '$rootScope', function($http, $rootScope) {
        return new _FactionService($http, $rootScope);
    }]);
})();