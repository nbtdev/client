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
        .controller('FundsIssuerAdminController', ['$sce', '$scope', '$timeout', 'nbtFaction', 'nbtLeague', 'nbtIdentity', function($sce, $scope, $timeout, nbtFaction, nbtLeague, nbtIdentity) {
            $scope.league = null;
            $scope.factions = null;
            $scope.allFactions = null

            var timeoutPromise = null;

            function setStatus(message, success) {
                $scope.message = message;
                $scope.success = success;

                // cause the message to go away in 5 seconds
                if (timeoutPromise)
                    $timeout.cancel(timeoutPromise);

                timeoutPromise = $timeout(function() {
                    $scope.message = null;
                    timeoutPromise = null;
                }, 5000);
            }

            function reloadFactions() {
                if ($scope.league) {
                    nbtFaction.fetchFactionsForLeague($scope.league, nbtIdentity.get().token, function (factions) {
                        $scope.factions = factions;
                        $scope.allFactions = factions;
                    });
                }
            }

            // this will only succeed for admin logins; all others will get "Access is denied"
            $scope.onIssueFunds = function(faction) {
                var data = {
                    credit: faction.issuanceAmount,
                    note: faction.issuanceReason
                };

                nbtFaction.transferFunds(faction, data, nbtIdentity.get().token,
                    function(aData) {
                        setStatus("Transaction succeeded", true);
                        faction.issuanceAmount = null;
                        faction.issuanceReason = null;
                        reloadFactions();
                    },
                    function(aErr) {
                        setStatus(aErr.message, false);
                    }
                );
            };

            function runPayroll(league, scope) {
                var data = {
                    affectedFactions: [],
                    type: 'PAYDAY',
                    scope: scope
                };

                $scope.factions.forEach(function(e,i,a) {
                    if (e.selected)
                        data.affectedFactions.push(e);
                });

                nbtLeague.runPayroll(league, data, nbtIdentity.get().token,
                    function(aData) {
                        setStatus("Transaction succeeded", true);
                        reloadFactions();
                    },
                    function(aErr) {
                        setStatus(aErr.message, false);
                    }
                );
            }

            $scope.onIssueWeeklyNetIncome = function() {
                runPayroll($scope.league, 'WEEKLY');
            };

            $scope.onIssueMonthlyNetIncome = function() {
                runPayroll($scope.league, 'MONTHLY');
            };

            $scope.$watch('activeOnly', function(newVal, oldVal) {
                if (!newVal) {
                    $scope.factions = $scope.allFactions;
                    return;
                }

                // otherwise, filter out non-active factions
                var filtered = [];
                $scope.allFactions.forEach(function(e, i, a) {
                    if (e.factionStatus.displayName === 'Active')
                        filtered.push(e);
                });

                $scope.factions = filtered;
            });

            $scope.$watch('selectAll', function(newVal, oldVal) {
                if ($scope.factions) {
                    $scope.factions.forEach(function (e, i, a) {
                        e.selected = newVal;
                    });
                }
            });

            $("#fundsIssuerModal").on('show.bs.modal', function() {
                reloadFactions();
            });

            var cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                $scope.league = league;
            });
            $scope.$on('destroy', cb);
        }]);
})();
