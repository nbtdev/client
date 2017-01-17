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
    var mLogo = null;
    var mLogoSmall = null;
    var mSelfLink = null;
    var mProfileLink = null;
    var mUserProfileLink = null;
    var mPlanetsLink = null;

    function League(aInit) {
        if (aInit) {
            mId = aInit.id ? aInit.id : -1;
            mName = aInit.name ? aInit.name : null;
            mLogo = aInit.logo ? aInit.logo : null;
            mLogoSmall = aInit.logoSmall ? aInit.logoSmall : null;
            mSelfLink = aInit._links.self ? aInit._links.self : null;
            mProfileLink = aInit._links.profile ? aInit._links.profile : null;
            mUserProfileLink = aInit._links.userProfile ? aInit._links.userProfile : null;
            mPlanetsLink = aInit._links.planets ? aInit._links.planets : null;
        }
    }

    League.prototype = {
        isValid: function () {
            return mId > 0;
        },

        name: function () {
            return mName;
        },

        logo: function () {
            return mLogo;
        },

        logoSmall: function () {
            return mLogoSmall;
        },

        selfLink: function () {
            return mSelfLink;
        },

        userProfileLink: function () {
            return mUserProfileLink;
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

        serialize: function() {
            return JSON.stringify({
                id: mId,
                name: mName,
                logo: mLogo,
                logoSmall: mLogoSmall,
                _links: {
                    self: mSelfLink,
                    profile: mProfileLink,
                    userProfile: mUserProfileLink,
                    planets: mPlanetsLink
                }
            });
        },

        update : function(aDetails) {
            if (aDetails) {
                mId = aDetails.id ? aDetails.id : mId;
                mName = aDetails.name ? aDetails.name : mName;
                mLogo = aDetails.logo ? aDetails.logo : mLogo;
                mLogoSmall = aDetails.logoSmall ? aDetails.logoSmall : mLogoSmall;
                mSelfLink = aDetails._links.self ? aDetails._links.self : mSelfLink;
                mProfileLink = aDetails._links.profile ? aDetails._links.profile : mProfileLink;
                mUserProfileLink = aDetails._links.userProfile ? aDetails._links.userProfile : mUserProfileLink;
                mPlanetsLink = aDetails._links.planets ? aDetails._links.planets : mPlanetsLink;
            }
        },
    };

    return League;
})();
