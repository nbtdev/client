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

var _Battle = (function() {
    var mBattleObj = null;

    function Battle(aBattleObj) {
        mBattleObj = aBattleObj;
    }

    Battle.prototype.getType = function() {
        if (mBattleObj) {
            // TODO: i18n
            switch(mBattleObj.type) {
                case 'TrespassDispute' : return 'TRESPASS DISPUTE';
                case 'Reconnaissance' : return 'RECONNAISSANCE';
                case 'RaidMechTheft' : return 'MECH THEFT RAID';
                case 'RaidIndustryTheft' : return 'INDUSTRY THEFT RAID';
                case 'RaidIndustryDestroy' : return 'INDUSTRY DESTRUCTION RAID';
                case 'RaidFactoryDisrupt' : return 'FACTORY DISRUPTION RAID';
                case 'RaidFactoryDestroy' : return 'FACTORY DESTRUCTION RAID';
                case 'GuerrillaRaid' : return 'GUERRILLA RAID';
                case 'PlanetaryAssault' : return 'PLANETARY ASSAULT';
                case 'SectorRaid' : return 'SECTOR RAID';
                case 'SectorAssault' : return 'SECTOR ASSAULT';
                default: return mBattle.type;
            }
        }

        return 'N/A';
    };

    Battle.prototype.getId = function() {
        if (mBattleObj) {
            return mBattleObj.id;
        }

        return 'N/A';
    };

    Battle.prototype.getStatus = function() {
        if (mBattleObj) {
            return mBattleObj.status;
        }

        return 'N/A';
    };

    Battle.prototype.getOutcome = function() {
        if (mBattleObj) {
            return mBattleObj.outcome;
        }

        return 'N/A';
    };

    Battle.prototype.getAttacker = function() {
        if (mBattleObj) {
            var rtn = {
                name: mBattleObj.attacker.displayName
            };

            if (mBattleObj.attacker._links) {
                rtn.ref = mBattleObj.attacker._links.self;
            }

            rtn.attackDate = new Date(mBattleObj.attackDate);

            return rtn;
        }

        return null;
    };

    Battle.prototype.getRef = function() {
        if (mBattleObj && mBattleObj._links) {
            return mBattleObj._links.self;
        }

        return null;
    };

    Battle.prototype.getAttackDate = function() {
        if (mBattleObj) {
            return new Date(mBattleObj.attackDate);
        }

        return null;
    };

    return Battle;
})();
