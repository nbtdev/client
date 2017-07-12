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

var _IdentityService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var nbtRoot = null;
    var mIdentity = null;
    var mCurrentProfile = null;

    function IdentityService(aHttp, aRootScope, aNbtRoot) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
        nbtRoot = aNbtRoot;

        // initialize the service
        restore();
        if (mIdentity)
           self.refresh();

        // post initial state to any subscribers
        //$rootScope.$broadcast('nbtIdentityChanged', self.get());
    }

    var clearLocalStorage = function() {
        localStorage.removeItem('nbtIdentity');
    };

    var save = function() {
        localStorage.setItem('nbtIdentity', JSON.stringify(mIdentity));
    };

    var restore = function() {
        try {
            var currentIdent = mIdentity;

            if (localStorage.nbtIdentity)
                mIdentity = JSON.parse(localStorage.nbtIdentity);

            if (mIdentity !== currentIdent)
                rootScope.$broadcast('nbtIdentityChanged', self.get());
        } catch (e) {
            console.log(e);
        }
    };

    IdentityService.prototype.reset = function() {
        // clear out any current user identity object
        mIdentity = null;

        // reset current profile to none
        mCurrentProfile = null;

        // clear out any existing cached login data (local storage)
        clearLocalStorage();
    };

    IdentityService.prototype.profile = function() {
        if (mCurrentProfile) {
            return {
                callsign: mCurrentProfile.callsign,
                links: {
                    faction: mCurrentProfile._links.faction
                }
            };
        }

        return null;
    };

    IdentityService.prototype.get = function() {
        // first check to see if the token is expired
        if (mIdentity) {
            var ms = mIdentity.expires;
            var d = new Date();
            var now = d.getTime();

            if (now > ms) {
                // then token is expired, try to refresh it -- if this fails, it will
                // basically perform a logout
                self.refresh();
            }
        }

        if (mIdentity) {
            return {
                token: mIdentity.value,
                isSiteAdmin: function() { return mIdentity.coarseRole ? mIdentity.coarseRole==='SITE_ADMIN' : false; },
                isLeagueAdmin: function() { return mIdentity.coarseRole ? mIdentity.coarseRole==='LEAGUE_ADMIN' : false;  },
                isTeamAdmin: function() { return mIdentity.coarseRole ? mIdentity.coarseRole==='TEAM_ADMIN' : false;  }
            };
        }

        return {
            token: null,
            isSiteAdmin: function() { return false; },
            isLeagueAdmin: function() { return false;  },
            isTeamAdmin: function() { return false;  }
        };
    };

    IdentityService.prototype.login = function(aUsername, aPassword, aSuccess, aFailure) {
        // clear out any existing user data
        this.reset();

        // attempt to get a token based on the provided login credentials
        http({
            method: 'POST', // TODO: get this from the links!
            url: nbtRoot.links().login.href,
            data: { // TODO: fill out a template that we get from the links!
                username: aUsername,
                password: aPassword
            }
        }).then(
            function(resp) {
                // save the new user data
                mIdentity = resp.data;

                save();

                // invoke the callback, if any
                if (aSuccess) aSuccess(resp.data);

                // post event to any subscribers
                rootScope.$broadcast('nbtIdentityChanged', self.get());
            },
            function(resp) {
                // invoke the callback, if any
                if (aFailure) aFailure(resp.data);
            }
        );
    };

    IdentityService.prototype.logout = function() {
        if (mIdentity) {
            var hdrs = new Headers(Header.TOKEN, mIdentity.value);

            http({
                method: 'DELETE', // TODO: get this from the links!
                url: mIdentity._links.logout.href,
                headers: hdrs.get()
            });
        }

        this.reset();

        // post event to any subscribers
        rootScope.$broadcast('nbtIdentityChanged', this.get());
    };

    IdentityService.prototype.refresh = function(aFailureCb) {
        if (mIdentity) {
            var hdrs = new Headers(Header.TOKEN, mIdentity.value);

            // attempt to refresh the token, if failed, callback on any supplied valid function
            // and clear ourselves (failure for any reason means the token is no longer valid)
            http({
                method: 'PUT', // TODO: get this from the links!
                url: mIdentity._links.refresh.href,
                headers: hdrs.get()
            }).then(
                function(resp) {
                    // replace the identity with the refreshed one
                    mIdentity = resp.data;
                },
                function (resp) {
                    self.reset();
                    if (aFailureCb) aFailureCb();
                }
            );
        }
    };

    IdentityService.prototype.register = function(aRegData, aCaptchaResponse, aSuccess, aFailure) {
        // submit the new-user registration
        var hdrs = new Headers(Header.CAPTCHA, aCaptchaResponse);

        http({
            method: 'POST', // TODO: get from links!
            url: nbtRoot.links().signup.href,
            data: aRegData,
            headers: hdrs.get()
        }).then(
            function(resp) {
                if (aSuccess) aSuccess(resp.data);
            },
            function(resp) {
                if (aFailure) aFailure(resp.data);
            }
        );
    };

    IdentityService.prototype.onLeagueChanged = function(aLeague) {
        if (mIdentity) {
            var hdrs = new Headers(Header.TOKEN, mIdentity.value);

            if (aLeague) {
                // fetch the user's profile for this league
                http({
                    method: 'GET', // TODO: get from links!
                    url: aLeague._links.userProfile.href,
                    headers: hdrs.get()
                }).then(function (resp) {
                    mCurrentProfile = resp.data;
                    rootScope.$broadcast('nbtProfileChanged', mCurrentProfile);
                });
            } else {
                // fetch default profile?
                http({
                    method: 'GET', // TODO: get from links!
                    url: mIdentity._links.self.href,
                    headers: hdrs.get()
                }).then(function (resp) {
                    mCurrentProfile = resp.data;
                    rootScope.$broadcast('nbtProfileChanged', mCurrentProfile);
                });
            }
        }
    };

    return IdentityService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtIdentity', ['$http', '$rootScope', 'nbtRoot', function($http, $rootScope, nbtRoot) {
        var iserv = new _IdentityService($http, $rootScope, nbtRoot);
        return iserv;
    }]);
})();