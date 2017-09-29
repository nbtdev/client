/**
 Copyright (c) 2017, Netbattletech
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
    angular
    .module('nbt.app')
    .controller('NavbarController', ['$scope', '$rootScope', '$timeout', 'nbtIdentity', 'nbtLeague', 'nbtFaction', function($scope, $rootScope, $timeout, nbtIdentity, nbtLeague, nbtFaction) {

        var reset = function() {
            $scope.league = null;
            $scope.leagues = null;
            $scope.identity = null;
            $scope.faction = null;
            $scope.alerts = null;
            $scope.newAlertCount = 0;
        };

        reset();

        $scope.isAdmin = function() {
            var token = nbtIdentity.get();
            if (token.isValid())
                return token.isSiteAdmin() || token.isLeagueAdmin();

            return false;
        };

        $scope.isTeamAdmin = function() {
            var token = nbtIdentity.get();
            if (token.isValid())
                return token.isTeamAdmin();

            return false;
        };

        $scope.isLoggedIn = function() {
            return localStorage.getItem("nbtIdentity") !== null;
        };

        $scope.signOut = function() {
            nbtIdentity.logout();
            localStorage.removeItem("nbtIdentity");
        };

        function processAlerts() {
            $scope.newAlertCount = 0;

            if ($scope.alerts) {
                $scope.alerts.forEach(function (e) {
                    if (!e.readDatetime) $scope.newAlertCount++;
                });
            }
        }

        function processFactionInvitation(alert, action) {
            if (action === 'accept') {
                nbtFaction.acceptInvite(alert, nbtIdentity.get().token, function() {
                    $scope.onDismissAlert(alert);

                    // set off a chain of data reloading...
                    nbtIdentity.refresh();
                    refreshLeague();
                });
            }

            if (action === 'decline') {
                nbtFaction.declineInvite(alert, nbtIdentity.get().token, function() {
                    $scope.onDismissAlert(alert);
                });
            }
        }

        $scope.onDismissAlert = function(alert) {
            nbtLeague.dismissAlert(alert, nbtIdentity.get().token, function(aAlerts) {
                $scope.alerts = null;
                if (aAlerts._embedded) {
                    $scope.alerts = aAlerts._embedded.alerts;
                }
                processAlerts();
            });
        };

        $scope.onAlertAction = function(event, alert) {
            var action = event.currentTarget.dataset.action;

            if (alert.type.name === 'Faction Invitation')
                processFactionInvitation(alert, action);
        };

        var timeoutPromise = null;
        function pollAlerts(league) {
            nbtLeague.fetchAlerts(league, nbtIdentity.get().token, function(aAlerts) {
                $scope.alerts = null;

                if (aAlerts._embedded)
                    $scope.alerts = aAlerts._embedded.alerts;

                processAlerts();

                // schedule another one later
                timeoutPromise = $timeout(function() {
                    pollAlerts($scope.league);
                }, 60000);
            });
        }

        var cbIdentity = $scope.$on('nbtIdentityChanged', function (event, aData) {
            $scope.identity = aData;
            $timeout.cancel(timeoutPromise);
            $scope.faction = null;
        });
        $scope.$on('destroy', cbIdentity);

        var setCurrentLeague = function(leagueId) {
            $scope.league = null;
            for (var i=0; i<$scope.leagues.length; ++i) {
                var l = $scope.leagues[i];
                if (l.id == leagueId) {
                    $scope.league = l;

                    // fire off a request to get the user profile for the current league
                    nbtLeague.fetchLeagueProfile($scope.league, nbtIdentity.get().token, function(aData) {
                        // fire off a request to get the faction I am in, if any
                        nbtFaction.fetchFactionDetail(aData.data.faction, nbtIdentity.get().token, function(aFaction) {
                            $scope.faction = aFaction;
                            $rootScope.$broadcast('nbtFactionChanged', $scope.faction);
                        });
                    });
                    break;
                }
            }

            if ($scope.league) {
                $rootScope.$broadcast('nbtLeagueChanged', $scope.league);
                pollAlerts($scope.league);
            }
        };

        function refreshLeague() {
            var leagueId = localStorage.getItem("leagueId");
            setCurrentLeague(leagueId);
        }

        var cbLeague = $scope.$on('nbtLeaguesChanged', function (event, leagues, leaguesRaw) {
            $scope.leagues = leaguesRaw;
            refreshLeague();
        });
        $scope.$on('destroy', cbLeague);

        cb = $scope.$on('nbtFactionsChanged', function (event, factions) {
            $scope.factions = factions;
        });
        $scope.$on('destroy', cb);

        $scope.onLeagueClicked = function(leagueId) {
            localStorage.setItem("leagueId", leagueId);
            setCurrentLeague(leagueId);
        };

        $("a.nbt-menu-item").on("click", function(event) {
            $rootScope.$broadcast(event.target.dataset.cmdtarget);
        });

        nbtLeague.fetchLeagues(nbtIdentity.get().token);
    }]);
})();
