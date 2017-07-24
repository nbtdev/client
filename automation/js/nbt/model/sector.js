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

var _Sector = (function() {
    var mSectorObj = null;

    function Sector(aSectorObj) {
        mSectorObj = aSectorObj;
    }

    Sector.prototype.getCapitalPlanet = function() {
        if (mSectorObj) {
            return new Planet(mSectorObj.capital);
        }

        return null;
    };

    Sector.prototype.getOwner = function() {
        if (mSectorObj) {
            return new Faction(mSectorObj.owner);
        }

        return null;
    };

    Sector.prototype.getPlanets = function() {
        var rtn = [];

        if (mSectorObj) {
            for (var i=0; i<mSectorObj.planets.length; ++i) {
                var planet = mSectorObj.planets[i];
                rtn.append(new Planet(planet));
            }
        }

        return rtn;
    };

    Sector.prototype.getRef = function() {
        if (mSectorObj && mSectorObj._links) {
            return mSectorObj._links.self;
        }

        return null;
    };

    return Sector;
})();
