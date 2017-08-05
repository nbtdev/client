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
        .controller('TrackerController', ['$sce', '$scope', '$timeout', 'nbtBattle', 'nbtIdentity', function($sce, $scope, $timeout, nbtBattle, nbtIdentity) {
            $scope.battle = null;
            $scope.selectedUnit = null;
            $scope.usedLimitAmount = 0;

            // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
            function drawRoundedRect(canvas, x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                canvas.beginPath();
                canvas.moveTo(x+r, y);
                canvas.arcTo(x+w, y,   x+w, y+h, r);
                canvas.arcTo(x+w, y+h, x,   y+h, r);
                canvas.arcTo(x,   y+h, x,   y,   r);
                canvas.arcTo(x,   y,   x+w, y,   r);
                canvas.closePath();
                return canvas;
            }

            function getDropResult(drop) {
                if (drop.number >= 0)
                    return '-';
            }

            function makeSummaryEntry(group, template) {
                return {
                    group: group,
                    name: template.name,
                    tonnage: template.tonnage,
                    bv: template.battleValue,
                    count: 0
                };
            }

            function processBattle() {
                // rename the 'number' field for easy display:
                //      * negative numbers for drops already completed and logged
                //      * 'Current' for the current drop
                //      * positive numbers for upcoming drops (if known)
                var currentDropIndex = -1;
                for (var i=0; i<$scope.battle.drops.length; ++i) {
                    var drop = $scope.battle.drops[i];

                    // go past all of the drops that have instances logged against them...
                    if (drop.combatUnitInstances) {
                        continue;
                    }

                    // we just want to know the index of the current drop; we will re-label the drops below
                    currentDropIndex = i;
                    $scope.drop = drop;
                    break;
                }

                // summarize/group all combat units by owner and count; the service will have updated the forcedec
                // to consider destroyed and repaired instances
                $scope.factionCombatUnits = {};
                for (var g=0; g<$scope.battle.sector.instanceGroups.length; ++g) {
                    var group = $scope.battle.sector.instanceGroups[g];

                    var ownerUnits = $scope.factionCombatUnits[group.owner.shortName];
                    if (!ownerUnits) {
                        ownerUnits = {
                            name: group.owner.displayName,
                            abbrev: group.owner.shortName,
                            units: {}
                        };
                        $scope.factionCombatUnits[group.owner.shortName] = ownerUnits;
                    }

                    for (var i=0; i<group.instances.length; ++i) {
                        var tmpl = group.instances[i].template;

                        var summary = ownerUnits.units[tmpl.designation];
                        if (!summary) {
                            summary = makeSummaryEntry(group, tmpl);
                            ownerUnits.units[tmpl.designation] = summary;

                            if (!$scope.selectedUnit)
                                $scope.selectedUnit = summary;
                        }

                        summary.count++;
                    }
                }

                // renumber the drops
                for (var d=0; d<$scope.battle.drops.length; ++d) {
                    var drop = $scope.battle.drops[d];

                    drop.number = d - currentDropIndex;
                    drop.result = getDropResult(drop);

                    if (drop.number === 0)
                        drop.number = 'Current';
                }
            }

            // function drawAssaultProgressBar() {
            //     // how many steps do we need? each side can claim up to (N-1)/2 planets, where N is the number of
            //     // member planets in the sector. So we need a center spot, and then (N-1)/2-1 spots on either side (the
            //     // "minus one" is because if someone claims that last planet, then we are either going to Siege or
            //     // going home
            //     var canvas = $('#assaultProgress')[0];
            //     var ctx = canvas.getContext('2d')
            //     var w = canvas.clientWidth - 10;
            //     var h = canvas.clientHeight - 10;
            //
            //     var fill = ctx.createLinearGradient(0, 0, w, 0);
            //     fill.addColorStop(0, "red");
            //     fill.addColorStop(0.5, "green");
            //     fill.addColorStop(1, "red");
            //     ctx.fillStyle = fill;
            //     drawRoundedRect(ctx, 5, 5, w, h, 7).fill();
            //
            //     ctx.font = '48px Arial';
            //     ctx.fillStyle = 'white';
            //     ctx.textAlign = 'center';
            //     ctx.fillText('Capture', w / 2 + 5, h / 2 + 5);
            // }
            //
            // function drawProgressBar() {
            //     if (!$scope.battle)
            //         return;
            //
            //     if ($scope.battle.type === 'Sector Assault')
            //         drawAssaultProgressBar();
            // }

            function removeObjectFromArrayById(obj, array) {
                var idx = array.findIndex(function(e, i, a) {
                    return (e.id === obj.id);
                }, array);
                array.splice(idx, 1);
            }

            // find and claim the next available combat unit instance for this owner, that matches the designation.
            // For example, the next available CDA for Federated Suns. This function will also remove the instance from
            // the owner's stocks
            function claimNextUnitInstanceForOwner(summary) {
                var group = summary.group;
                for (var i = 0; i < group.instances.length; ++i) {
                    var instance = group.instances[i];

                    // "instance" can be undefined, as a previous claim operation could have wiped out its entry in the list
                    if (instance && instance.template.name === summary.name) {
                        removeObjectFromArrayById(instance, group.instances);
                        return instance;
                    }
                }

                return null;
            }

            function addUsedUnit(instance) {
                if (!$scope.usedUnits)
                    $scope.usedUnits = [];

                $scope.usedUnits.push(instance);

                if (instance.template.tonnage)
                    $scope.usedLimitAmount += instance.template.tonnage;

                if (instance.template.battleValue)
                    $scope.usedLimitAmount += instance.template.battleValue;
            }

            function moveUsedUnitToAvailable(unit) {
                // remove it from the used array...
                removeObjectFromArrayById(unit, $scope.usedUnits);

                // ...and add it back to the faction combat unit summaries...
                var ownerGroup = $scope.factionCombatUnits[unit.owner.shortName];
                var ownerUnits = ownerGroup.units;
                var units = ownerUnits[unit.template.designation];
                if (!units) {
                    units = makeSummaryEntry(ownerGroup, unit.template);
                    ownerUnits[unit.template.designation] = units;
                }
                units.count++;

                // ...as well as the 'forcedec' unit listings...
                var groups = $scope.battle.sector.instanceGroups;
                for (var i=0; i<groups.length; ++i) {
                    var group = groups[i];
                    if (group.owner.name !== unit.owner.name)
                        continue;

                    group.instances.push(unit);
                }

                // ...and then update the used-tonnage/BV total
                if (unit.template.tonnage)
                    $scope.usedLimitAmount -= unit.template.tonnage;

                if (unit.template.battleValue)
                    $scope.usedLimitAmount -= unit.template.battleValue;
            }

            $scope.useUnit = function(summary) {
                // limit to 8 instances used at a time
                if ($scope.usedUnits && $scope.usedUnits.length === 8)
                    return;

                if (summary) {
                    if (summary.count <= 0)
                        return;

                    var instance = claimNextUnitInstanceForOwner(summary);
                    if (instance) {
                        if (!instance.owner)
                            instance.owner = summary.group.owner;

                        addUsedUnit(instance);
                        summary.count--;
                    }
                }
            };

            $scope.unuseUnit = function(unit) {
                moveUsedUnitToAvailable(unit);
            };

            // move unit from used list to destroyed list
            $scope.destroyUnit = function(unit) {
                removeObjectFromArrayById(unit, $scope.usedUnits);

                if (!$scope.destroyedUnits)
                    $scope.destroyedUnits = [];

                $scope.destroyedUnits.push(unit);

                if (unit.template.tonnage)
                    $scope.usedLimitAmount -= unit.template.tonnage;

                if (unit.template.battleValue)
                    $scope.usedLimitAmount -= unit.template.battleValue;
            };

            $scope.undestroyUnit = function(unit) {
                removeObjectFromArrayById(unit, $scope.destroyedUnits);
                addUsedUnit(unit);
            };

            // notify us of battle changes/loads
            var cb = $scope.$on('nbtBattleChanged', function (event, battle) {
                $scope.battle = battle;
                processBattle();
                // drawProgressBar();
            });
            $scope.$on('destroy', cb);

            // notify us of faction changes/loads
            cb = $scope.$on('nbtFactionChanged', function (event, faction) {
                $scope.faction = faction;
            });
            $scope.$on('destroy', cb);
        }]);
})();
