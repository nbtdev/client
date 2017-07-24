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

function findPath(origin, destination, quadtree) {
    var rtn = [];

    rtn.push(origin);

    // get all planets within 60LY
    var planetsInRange = [];
    quadtree.findAllWithinRadiusEx(origin, 60.0, planetsInRange, function(planet) {
        // "OK" only for planets with charge station
        return (planet.chargeStation);
    });

    // assign a jump cost to each, removing the origin from this list
    for (var i=0; i<planetsInRange.length; ++i) {
        var planet = planetsInRange[i];
        if (planet.id === origin.id) {
            planetsInRange.remove(planet);
        } else {
            if (planet.chargeStation)
                planet.jumpCost = 0;
            else
                planet.jumpCost = planet.rechargeTime;
        }
    }

    rtn.push(destination);

    return rtn;
}

onmessage = function(taskData) {
    var data = taskData.data;

    console.log('Calculating path from ' + data.origin.name + ' to ' + data.destination.name);
    path = findPath(data.origin, data.destination, data.quadtree);
    postMessage(path);
};