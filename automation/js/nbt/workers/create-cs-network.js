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

importScripts('/js/nbt/util/quadtree-functions.js');

function createChargeStationNetwork(planetGroups, quadtree) {
    var startTime = performance.now();
    var csNetwork = {};

    for (var g=0; g<planetGroups.length; ++g) {
        var planetGroup = planetGroups[g];

        for (var p=0; p<planetGroup.planets.length; ++p) {
            var planet = planetGroup.planets[p];

            if (planet.chargeStation) {
                if (!planet.neighbors) {
                    planet.neighbors = {};
                }

                // find all CS neighbors within 60LY
                var neighbors = quadtree_findAllWithinRadiusEx(quadtree, planet, 60.0, function(iter) {
                    return iter.chargeStation && iter.id !== planet.id;
                });

                // if the neighbor does not already have us as a neighbor, add an edge between us
                for (var i=0; i<neighbors.length; ++i) {
                    var neighbor = neighbors[i].planet;
                    if (!neighbor.neighbors) {
                        neighbor.neighbors = {};
                    }

                    if (!neighbor.neighbors[planet.id]) {
                        neighbor.neighbors[planet.id] = planet;
                        planet.neighbors[neighbor.id] = neighbor;
                    }
                }

                csNetwork[planet.id] = planet;
            }
        }
    }

    var elapsed = performance.now() - startTime;
    console.log(elapsed.toFixed(2) + ' ms to create charge station network');

    return csNetwork;
}

onmessage = function(taskData) {
    var planetGroups = taskData.data.planetGroups;
    var quadtree = taskData.data.quadtree;

    postMessage(createChargeStationNetwork(planetGroups, quadtree));
};