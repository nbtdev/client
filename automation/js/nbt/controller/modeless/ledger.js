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
        .controller('LedgerController', ['$sce', '$scope', '$timeout', '$rootScope', 'nbtFaction', 'nbtIdentity', function($sce, $scope, $timeout, $rootScope, nbtFaction, nbtIdentity) {
            $scope.faction = null;
            $scope.factions = null;
            $scope.ledger = null;
            $scope.tx = {};

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
            }

            function processLedger(ledger) {
                // recalculate the account balance
                $scope.faction.accountBalance = 0;
                for (var i=0; i<ledger.length; ++i) {
                    var tx = ledger[i];
                    $scope.faction.accountBalance += tx.credit;
                    $scope.faction.accountBalance -= tx.debit;
                }
            }

            function reloadFactions(league) {
                nbtFaction.fetchFactionsForLeague(league, nbtIdentity.get().token, function(aFactions) {
                    var filtered = [];
                    aFactions.forEach(function(e,i,a) {
                        if (e.factionStatus.displayName === 'Active') {
                            filtered.push(e);
                        }
                    });

                    $scope.factions = filtered;
                });
            }

            function reloadLedger() {
                nbtFaction.fetchLedger($scope.faction, nbtIdentity.get().token, function(aLedger) {
                    $scope.ledger = aLedger._embedded.transactions;
                    processLedger($scope.ledger);
                });
            }

            $scope.onTransfer = function() {
                nbtFaction.transferFunds($scope.faction, $scope.tx, nbtIdentity.get().token,
                    function(aData) {
                        setOperationStatus("Transfer successful", true);
                        $scope.ledger = aData._embedded.transactions;
                        $scope.tx = {};
                        processLedger($scope.ledger);
                    },
                    function(aErr) {
                        setOperationStatus("Transfer failed: " + aErr.message, false);
                    }
                );
            };

            // TODO: don't tie this to a specific dialog...
            $("#cmdCloseLedgerDialog").on("click", function(event) {
                $timeout(function() {
                    $scope.show = false;
                }, 0);
            });

            // when the user clicks the Faction Tools "Jumpships" menu item...
            var cb = $scope.$on('cmdLedger', function (event, command) {
                // only load the ledger if we are opening
                if (!$scope.show) {
                    $scope.ledger = null;
                    reloadLedger();
                }

                $timeout(function() {
                    $scope.show = true;
                }, 0);
            });
            $scope.$on('destroy', cb);

            cb = $scope.$on('nbtFactionChanged', function(event, faction) {
                $scope.faction = faction;
            });
            $scope.$on('destroy', cb);

            cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                reloadFactions(league);
            });
            $scope.$on('destroy', cb);

            $scope.checkEnterKey = checkEnterKeyAndSubmit;
        }]);
})();
