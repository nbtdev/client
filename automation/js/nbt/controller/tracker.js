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

            var descriptions = {
                1:  'The attacker will be able to steal combat units from the sector\'s ' +
                     'garrisons. This is a scaled-success mechanic -- greater positive ' +
                     'differential between the attacker\'s and the defender\'s number of ' +
                     'credits earned in the raid will increase the detail available to the ' +
                     'attacker about the combat units present. Each credit is worth 250 tons ' +
                     'of combat units stolen',
                2:  'The attacker will be able to steal industry from the total industrial ' +
                    'production in the sector. This is a scaled-success mechanic -- greater ' +
                    'positive differential between the attacker\'s and the defender\'s number ' +
                    'of credits earned in the raid will increase the detail available to the ' +
                    'attacker about the industrial output in the sector. Each credit is worth ' +
                    '50,000,000 c-bills of industry stolen.',
                3:  'The attacker will be able to decrease the total industrial production in the ' +
                    'sector. This is a scaled-success mechanic -- greater positive differential ' +
                    'between the attacker\'s and the defender\'s number of credits earned in the ' +
                    'raid will increase the detail available to the attacker about the industrial ' +
                    'output in the sector. Each credit is worth 50,000,000 c-bills of industry destroyed.',
                4:  'The attacker will be able to suspend factory output in the sector for a period of ' +
                    'time. This is a scaled-success mechanic -- greater positive differential between ' +
                    'the attacker\'s and the defender\'s number of credits earned in the raid will ' +
                    'increase the detail available to the attacker about the factories present in the sector. ' +
                    'Each credit is worth 3 days of factory slot disruption.',
                5:  'The attacker will be able permanently to reduce factory output in the sector. ' +
                    'This is a scaled-success mechanic -- greater positive differential ' +
                    'between the attacker\'s and the defender\'s number of credits earned in the raid will ' +
                    'increase the detail available to the attacker about the factories present in the sector. ' +
                    'Each credit is worth 1 combat unit worth of factory output reduction.',
                6:  'The attacker will be able to induce political instability in the sector for a period of time. ' +
                    'This is NOT a scaled-success mechanic. Each credit is worth 10% chance of inducing political ' +
                    'instability (cumulative) for 24 hours, or 3 days worth of political instability (on top of ' +
                    'the base 24 hours). These can be used together; for instance, if an attacker has 10 credits ' +
                    'to spend, they might spend 8 of them to increase the chance that political instability occurs, ' +
                    'and the remaining 2 to extend the period to a week (7 days). Or they might spend all 10 to be ' +
                    'certain that they induce 24 hours of political instability.',
                7:  'The attacker will be able to place spies in the sector. Mechanics TBD.',
                8:  'The defender may employ ground- and/or space-based defenses to destroy enemy dropships making ' +
                    'their way back to their jumpship. This destroys the dropship and any combat units it is carrying. ' +
                    'Combat units destroyed in this fashion are not subject to repair -- consider them vaporized. ' +
                    'One credit per 5% chance of destroying one dropship.',
                9:  'The defender may spend credits to reduce the detail available to the attacker for combat unit or ' +
                    'industry theft, or industry or factory disruption or damage. 1 defender credit per attacker credit ' +
                    'offset.',
                10: 'Similar to how a defender can offset an attackers theft, disruption or destruction effectiveness ' +
                    'with Enhanced Security, the defender can reduce the effectiveness of spies placed in their space ' +
                    'by spending credits on counter- intelligence. The number of credits spent reduces the effectiveness ' +
                    'of enemy spies, from the least effective to the most effective, by reducing their effective attacker ' +
                    'credit spend by the number of credits the defender spends. If the attacker does not spend anything ' +
                    'on spies, the Counter-Intelligence credits are lost.',
                11: 'The defender can spend credits to offset the chance or the length of time that the sector will ' +
                    'enter political instability, if the attacker chose to spend credits on Political Instability. The ' +
                    'offset is 1 attacker credit per defender credit, and will offset attacker credits spent on duration ' +
                    '(all the way to zero) before they offset attacker credits spent on chance of instability (again, ' +
                    'all the way to zero).',
                12: 'The defender can spend credits in an effort to prevent future raids on the sector for a period of ' +
                    'time. This does not affect the ability for an opponent to launch a Sector Assault on the sector. ' +
                    'Each credit is worth one (1) day worth of immunity from raids (from the date and time the current ' +
                    'raid was logged).'
            };

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

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
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

            function findInvolvedFactionIds(battle) {
                // the obvious ones are the attacker and the sector owner
                var rtn = {
                    attackers: [battle.attacker.id],
                    defenders: [battle.sector.owner.id]
                };

                // then the allies
                if (battle.alliedAttackers) {
                    for (var i = 0; i < battle.alliedAttackers.length; ++i) {
                        rtn.attackers.push(battle.alliedAttackers[i].id);
                    }
                }

                if (battle.alliedDefenders) {
                    for (var i = 0; i < battle.alliedDefenders.length; ++i) {
                        rtn.defenders.push(battle.alliedDefenders[i].id);
                    }
                }

                return rtn;
            }

            function arrayContains(array, obj) {
                if (Array.prototype.includes) {
                    return array.includes(obj);
                } else {
                    // do it the hard way...
                    var idx = array.indexOf(obj, function(e, i, a) {
                        return (e===obj);
                    }, array);
                    return idx !== -1;
                }
            }

            function isFullyLogged(drop, factionIds) {
                var defenderLogged = false;
                var attackerLogged = false;

                if (drop.combatUnitInstances) {
                    for (var i=0; i<drop.combatUnitInstances.length; ++i) {
                        if (!attackerLogged && arrayContains(factionIds.attackers, drop.combatUnitInstances[i].owner.id)) {
                            attackerLogged = true;
                            continue;
                        }

                        if (!defenderLogged && arrayContains(factionIds.defenders, drop.combatUnitInstances[i].owner.id)) {
                            defenderLogged = true;
                            continue;
                        }

                        if (attackerLogged && defenderLogged)
                            break;
                    }
                }

                return (attackerLogged && defenderLogged);
            }

            function getCurrentDrop(battle, factionIds) {
                if (battle.drops) {
                    for (var d = 0; d < battle.drops.length; ++d) {
                        var drop = battle.drops[d];

                        // go past all of the drops that have instances logged against them...
                        if (isFullyLogged(drop, factionIds))
                            continue;

                        // we just want to know the index of the current drop; we will re-label the drops below
                        return d;
                    }
                }

                return -1;
            }

            function groupInstancesForTheft() {
                try {
                    var theft = $scope.battle.combatUnitTheft;
                    var theftDict = {};

                    $scope.battle.theftInstances = [];
                    $scope.battle.theftLimit = theft.theftTons;

                    theft.instances.forEach(function(e) {
                        var inst = theftDict[e.template.id];
                        if (!inst) {
                            inst = {
                                id: e.template.id,
                                name: e.template.name,
                                template: e.template,
                                count: 0
                            };
                            theftDict[e.template.id] = inst;
                            $scope.battle.theftInstances.push(inst);
                        }

                        inst.count++;
                    });
                } catch (e) {
                    return;
                }
            }

            function findEffectById(effectId) {
                var idx = $scope.raidEffects.findIndex(function(e,i,a) {
                    return (e.id === effectId);
                });

                if (idx >= 0)
                    return $scope.raidEffects[idx];

                return null;
            }

            function processRaidEffects(effects, isAttacker) {
                $scope.raidEffects.length = 0;
                effects.forEach(function(e,i,a) {
                    if (isAttacker && e.attacker)
                        $scope.raidEffects.push(e);
                    if (!isAttacker && !e.attacker)
                        $scope.raidEffects.push(e);

                    e.description = descriptions[e.id];
                });

                // go through the battle opponent effects and patch up the raid effects list
                // with quantities
                var factionEffects;
                if (isAttacker) factionEffects = $scope.battle.attackerEffects;
                else factionEffects = $scope.battle.defenderEffects;

                if (factionEffects) {
                    factionEffects.forEach(function (e) {
                        var effect = findEffectById(e.effect.id);
                        if (effect) {
                            effect.credits = e.credits;
                        }
                    });
                }
            }

            function processBattle() {
                $scope.usedUnits = [];
                $scope.destroyedUnits = [];
                $scope.usedLimitAmount = 0;
                $scope.stolenUnits = [];
                $scope.stolenAmount = 0;
                $scope.drop = null;

                // set a convenience field to match the number of planets available
                $scope.battle.sector.planetsInPlay = $scope.battle.sector.planets.length;
                if ($scope.battle.sector.planets.length % 2 === 0)
                    $scope.battle.sector.planetsInPlay--;

                // rename the 'number' field for easy display:
                //      * negative numbers for drops already completed and logged
                //      * 'Current' for the current drop
                //      * positive numbers for upcoming drops (if known)
                var factionIds = findInvolvedFactionIds($scope.battle);
                $scope.battle.isAttacker = false;
                if (arrayContains(factionIds.attackers, $scope.faction.id)) {
                    $scope.battle.isAttacker = true;

                    groupInstancesForTheft();
                }

                $scope.battle.isWinner = false;
                if ($scope.battle.isAttacker && $scope.battle.outcome === 'Attacker Victorious')
                    $scope.battle.isWinner = true;
                if (!$scope.battle.isAttacker && $scope.battle.outcome === 'Defender Victorious')
                    $scope.battle.isWinner = true;

                if (!$scope.battle.isWinner)
                    $scope.battle.repairsOffered = null;

                if ($scope.battle.type === 'Sector Assault') {
                    $scope.battle.attackerScore = $scope.battle.attackerPlanetCount;
                    $scope.battle.defenderScore = $scope.battle.defenderPlanetCount;
                } else {
                    $scope.battle.attackerScore = $scope.battle.attackerCreditCount;
                    $scope.battle.defenderScore = $scope.battle.defenderCreditCount;
                }

                // set the 'confirmed' flag
                if ($scope.battle.isAttacker && $scope.battle.attackerConfirm ||
                    !$scope.battle.isAttacker && $scope.battle.defenderConfirm) {
                    $scope.battle.confirmed = true;
                }

                if ($scope.battle.isAttacker && $scope.battle.attackerLoggingComplete ||
                    !$scope.battle.isAttacker && $scope.battle.defenderLoggingComplete) {
                    $scope.battle.loggingComplete = true;
                }

                // if the battle status is "Completed", fetch raid effects list
                if ($scope.battle.status === 'Completed') {
                    nbtBattle.fetchRaidEffects($scope.battle, nbtIdentity.get().token, function(aEffects) {
                        $scope.raidEffects = [];
                        processRaidEffects(aEffects._embedded.effects, $scope.battle.isAttacker);
                    });
                }

                var currentDropIndex = getCurrentDrop($scope.battle, factionIds);
                if (currentDropIndex >= 0)
                    $scope.drop = $scope.battle.drops[currentDropIndex];

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

                // tag the current drop and calculate the drop losses
                if ($scope.battle.drops) {
                    for (var d = 0; d < $scope.battle.drops.length; ++d) {
                        var drop = $scope.battle.drops[d];
                        if (d === currentDropIndex)
                            drop.number = 'Current';
                        else
                            drop.number = d + 1;

                        // annotate the drop results from the perspective of the viewer
                        if ($scope.battle.isAttacker) {
                            drop.myLosses = drop.attackerUnitsDestroyed;
                            drop.theirLosses = drop.defenderUnitsDestroyed;
                        } else {
                            drop.theirLosses = drop.attackerUnitsDestroyed;
                            drop.myLosses = drop.defenderUnitsDestroyed;
                        }
                    }
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

            // find and claim the next available combat unit instance that matches the designation.
            // For example, the next available CDA. This function will also remove the instance from
            // the available-to-steal list
            function stealNextUnitInstance(summary) {
                var instance = null;
                $scope.battle.combatUnitTheft.instances.some(function(e) {
                    if (e.template.name === summary.name) {
                        removeObjectFromArrayById(e, $scope.battle.combatUnitTheft.instances);
                        instance = e;
                        return true;
                    }

                    return false;
                });

                return instance;
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

            function addStolenUnit(instance) {
                if (!$scope.stolenUnits)
                    $scope.stolenUnits = [];

                $scope.stolenUnits.push(instance);

                if (instance.template.tonnage)
                    $scope.stolenAmount += instance.template.tonnage;

                if (instance.template.battleValue)
                    $scope.stolenAmount += instance.template.battleValue;
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


            function moveStolenUnitToAvailable(unit) {
                // remove it from the used array...
                removeObjectFromArrayById(unit, $scope.stolenUnits);

                // ...and add it back to the faction combat unit summaries...
                var group = null;
                $scope.battle.theftInstances.some(function(e) {
                    if(e.template.id === unit.template.id) {
                        group = e;
                        return true;
                    }
                });

                if (!group) {
                    group = {
                        count: 0,
                        template: unit.template,
                        name: unit.template.name,
                        id: unit.template.id
                    };
                    $scope.battle.theftInstances.push(group);
                }

                group.count++;

                // ...as well as the 'forcedec' unit listings...
                $scope.battle.combatUnitTheft.instances.push(unit);

                // ...and then update the used-tonnage/BV total
                if (unit.template.tonnage)
                    $scope.stolenAmount -= unit.template.tonnage;

                if (unit.template.battleValue)
                    $scope.stolenAmount -= unit.template.battleValue;
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

            $scope.repairUnit = function(unit) {
                if (!$scope.battle.repairsAccepted)
                    $scope.battle.repairsAccepted = [];

                $scope.battle.repairsAccepted.push(unit);
                removeObjectFromArrayById(unit, $scope.battle.repairsOffered);
            };

            $scope.unrepairUnit = function(unit) {
                $scope.battle.repairsOffered.push(unit);
                removeObjectFromArrayById(unit, $scope.battle.repairsAccepted);
            };

            $scope.stealUnit = function(summary) {
                if (summary) {
                    if (summary.count <= 0)
                        return;

                    var instance = stealNextUnitInstance(summary);
                    if (instance) {
                        addStolenUnit(instance);
                        summary.count--;
                    }
                }
            };

            $scope.unstealUnit = function(unit) {
                moveStolenUnitToAvailable(unit);
            };

            // move unit from used list to destroyed list
            $scope.destroyUnit = function(unit) {
                if (!$scope.destroyedUnits)
                    $scope.destroyedUnits = [];

                unit.destroyed = 1;
                $scope.destroyedUnits.push(unit);
            };

            $scope.undestroyUnit = function(unit) {
                removeObjectFromArrayById(unit, $scope.destroyedUnits);
                delete unit.destroyed;
            };

            function checkBattleUpdate(battle) {
                // if the battle is still ongoing and we are waiting for the other side to log,
                // then check what we get for current drop in the returned data against what is
                // the current drop in the scope, and if they are the same, keep polling
                if (battle.outcome === 'Pending' && $scope.updating) {
                    var factionIds = findInvolvedFactionIds($scope.battle);
                    var newCurrentDropIndex = getCurrentDrop(battle, factionIds);
                    if (newCurrentDropIndex >= 0) {
                        var newDrop = battle.drops[newCurrentDropIndex];
                        if (newDrop.id === $scope.drop.id) {
                            pollBattleUpdate(battle);
                            return;
                        }
                    }
                }

                $scope.battle = battle;
                processBattle();
                $scope.updating = false;
            }

            function pollBattleUpdate(battle) {
                // check every 3 seconds until a new drop is posted
                $timeout(function() {
                    nbtBattle.fetchBattleDetail($scope.battle, nbtIdentity.get().token, function(aData) {
                        checkBattleUpdate(aData);
                    });
                }, 3000);
            }

            // log the current drop
            $scope.logDrop = function() {
                if (!$scope.drop) {
                    alert("There is no current drop to log; perhaps\n" +
                        "the opponent needs to log or confirm?");
                    return;
                }

                $scope.drop.combatUnitInstances = $scope.usedUnits;

                // if the user empties the field, it comes up with a zero-length string and the backend doesn't
                // like that -- null it out in this case
                if ($scope.drop.gameId && $scope.drop.gameId.length === 0)
                    $scope.drop.gameId = null;

                if (!$scope.drop.gameId && $scope.drop.combatUnitInstances.length===0)
                    return;

                $scope.updating = true;
                nbtBattle.logBattleDrop($scope.drop, nbtIdentity.get().token,
                    function(aData) {
                        checkBattleUpdate(aData);
                    },
                    function(aErr) {
                        $scope.updating = false;
                        if (aErr.message)
                            setOperationStatus(aErr.message, false);
                        else {
                            $scope.gameResolutionIssues = aErr;
                            setOperationStatus("Unresolved logging issues detected", false);
                        }
                    }
                );
            };

            $scope.reloadBattle = function() {
                $scope.gameResolutionIssues = null;
                nbtBattle.fetchBattleDetail($scope.battle, nbtIdentity.get().token, function(aData) {
                    $scope.battle = aData;
                    processBattle();
                });
            };

            $scope.commitEffects = function() {
                var theft = {
                    instances: $scope.stolenUnits
                };

                if ($scope.battle.combatUnitTheft) {
                    theft['selectedClass'] = $scope.battle.combatUnitTheft.selectedClass;
                }

                nbtBattle.commitEffects($scope.battle, theft, nbtIdentity.get().token, function(aData) {
                    $scope.battle = aData;
                    processBattle();
                }, function (aErr) {
                    setOperationStatus(aErr.message, false);
                });
            };

            $scope.commitRepairs = function() {
                if (!$scope.battle.repairsAccepted)
                    $scope.battle.repairsAccepted = [];

                nbtBattle.commitRepairs($scope.battle, nbtIdentity.get().token, function(aData) {
                    $scope.battle = aData;
                    processBattle();
                }, function (aErr) {
                    setOperationStatus(aErr.message, false);
                });
            };

            $scope.confirmBattle = function() {
                $scope.battle.updating = true;
                $scope.battleStatus = $scope.battle.status;
                nbtBattle.toggleBattleConfirm($scope.battle, nbtIdentity.get().token, function(aData) {
                    $scope.battle = aData;
                    processBattle();
                    $scope.battle.updating = false;
                }, function(aErr) {
                    setOperationStatus(aErr.message, false);
                    $scope.battle.updating = false;
                });
            };

            $scope.finalizeBattle = function() {
                $scope.battle.updating = true;
                nbtBattle.finalizeBattle($scope.battle, nbtIdentity.get().token, function(aData) {
                    $scope.battle = aData;
                    processBattle();
                }, function(aErr) {
                    setOperationStatus(aErr.message, false);
                });
            };

            $scope.spendCredits = function() {
                var effects = [];

                // for each effect, if the credit count is not zero or null, add it to the list
                $scope.raidEffects.forEach(function(e) {
                    if (e.credits && e.credits > 0) {
                        effects.push({
                            effect: e,
                            credits: e.credits
                        });
                    }
                });

                $scope.battle.updating = true;
                nbtBattle.spendCredits($scope.battle, effects, nbtIdentity.get().token, function(aData) {
                    $scope.battle = aData;
                    processBattle();
                    $scope.battle.updating = false;
                }, function(aErr) {
                    setOperationStatus(aErr.message, false);
                    $scope.battle.updating = false;
                });
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
