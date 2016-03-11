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

var _League = (function() {
    var mId = -1;
    var mName = null;
    var mSelfLink = null;
    var mProfileLink = null;
    var mPlanetsLink = null;

    function League(aInit) {
        if (aInit) {
            mId = aInit.id ? aInit.id : -1;
            mName = aInit.name ? aInit.name : null;
            mSelfLink = aInit.self ? aInit.self : null;
            mProfileLink = aInit.profile ? aInit.profile : null;
            mPlanetsLink = aInit.planets ? aInit.planets : null;
        }
    }

    League.prototype = {
        isValid: function () {
            return mId > 0;
        },

        name: function () {
            return mName;
        },

        selfLink: function () {
            return mSelfLink;
        },

        profileLink: function () {
            return mProfileLink;
        },

        planetsLink: function () {
            return mPlanetsLink;
        },

        id: function () {
            return mId;
        },

        update : function(aDetails) {
            if (aDetails) {
                mId = aDetails.id ? aDetails.id : mId;
                mName = aDetails.name ? aDetails.name : mName;
                mSelfLink = aDetails.self ? aDetails.self : mSelfLink;
                mProfileLink = aDetails.profile ? aInit.profile : mProfileLink;
                mPlanetsLink = aDetails.planets ? aInit.planets : mPlanetsLink;
            }
        },
    };

    return League;
})();
