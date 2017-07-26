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
        self.http = aHttp;
        self.rootScope = aRootScope;
        self.nbtRoot = aNbtRoot;
        self.mIdentity = null;
        self.mCurrentProfile = null;

        // initialize the service
        restore();
        if (self.mIdentity)
           self.refresh();

        // post initial state to any subscribers
        //$rootScope.$broadcast('nbtIdentityChanged', self.get());
    }

    var clearLocalStorage = function() {
        localStorage.removeItem('nbtIdentity');
    };

    var save = function() {
        localStorage.setItem('nbtIdentity', JSON.stringify(self.mIdentity));
    };

    var restore = function() {
        try {
            var currentIdent = self.mIdentity;

            if (localStorage.nbtIdentity)
                self.mIdentity = JSON.parse(localStorage.nbtIdentity);

            if (self.mIdentity !== currentIdent)
                self.rootScope.$broadcast('nbtIdentityChanged', self.get());
        } catch (e) {
            console.log(e);
        }
    };

    IdentityService.prototype.reset = function() {
        // clear out any current user identity object
        self.mIdentity = null;

        // reset current profile to none
        self.mCurrentProfile = null;

        // clear out any existing cached login data (local storage)
        clearLocalStorage();
    };

    IdentityService.prototype.profile = function() {
        if (self.mCurrentProfile) {
            return {
                callsign: self.mCurrentProfile.callsign,
                links: {
                    faction: self.mCurrentProfile._links.faction
                }
            };
        }

        return null;
    };

    IdentityService.prototype.get = function() {
        // first check to see if the token is expired
        if (self.mIdentity) {
            var ms = self.mIdentity.expires;
            var d = new Date();
            var now = d.getTime();

            if (now > ms) {
                // then token is expired, try to refresh it -- if this fails, it will
                // basically perform a logout
                self.refresh();
            }
        }

        if (self.mIdentity) {
            return {
                username: self.mIdentity.username,
                token: self.mIdentity.value,
                isSiteAdmin: function() { return self.mIdentity.coarseRole ? self.mIdentity.coarseRole==='SITE_ADMIN' : false; },
                isLeagueAdmin: function() { return self.mIdentity.coarseRole ? self.mIdentity.coarseRole==='LEAGUE_ADMIN' : false;  },
                isTeamAdmin: function() { return self.mIdentity.coarseRole ? self.mIdentity.coarseRole==='TEAM_ADMIN' : false;  },
                isValid: function() { return true; }
            };
        }

        return {
            username: null,
            token: null,
            isSiteAdmin: function() { return false; },
            isLeagueAdmin: function() { return false;  },
            isTeamAdmin: function() { return false;  },
            isValid: function() { return false; }
        };
    };

    IdentityService.prototype.login = function(aUsername, aPassword, aSuccess, aFailure) {
        // clear out any existing user data
        this.reset();

        // attempt to get a token based on the provided login credentials
        self.http({
            method: 'POST', // TODO: get this from the links!
            url: self.nbtRoot.links().login.href,
            data: { // TODO: fill out a template that we get from the links!
                username: aUsername,
                password: aPassword
            }
        }).then(
            function(resp) {
                // save the new user data
                self.mIdentity = resp.data;

                save();

                // invoke the callback, if any
                if (aSuccess) aSuccess(resp.data);

                // post event to any subscribers
                self.rootScope.$broadcast('nbtIdentityChanged', self.get());
            },
            function(resp) {
                // invoke the callback, if any
                if (aFailure) aFailure(resp.data);
            }
        );
    };

    IdentityService.prototype.requestPasswordReset = function(aUsername, aResetLink, aSuccess, aFailure) {
        // submit a request to reset the user's password
        self.http({
            method: 'POST', // TODO: get this from the links!
            url: self.nbtRoot.links().resetPassword.href,
            data: { // TODO: fill out a template that we get from the links!
                username: aUsername,
                resetPasswordUrl: aResetLink
            }
        }).then(
            function(resp) {
                // invoke the callback, if any
                if (aSuccess) aSuccess(resp.data);
            },
            function(resp) {
                // invoke the callback, if any
                if (aFailure) aFailure(resp.message);
            }
        );
    };

    IdentityService.prototype.updatePassword = function(aPassword, aNewPassword, aSuccess, aFailure) {
        if (!self.mIdentity)
            return;

        var hdrs = new Headers(Header.TOKEN, self.mIdentity.value);

        // actually do the password change, with the associated key
        self.http({
            method: 'PUT', // TODO: get this from the links!
            url: self.mIdentity._links.self.href,
            headers: hdrs.get(),
            data: { // TODO: fill out a template that we get from the links!
                username: self.mIdentity.username,
                password: aPassword,
                newPassword: aNewPassword
            }
        }).then(
            function(resp) {
                // invoke the callback, if any
                if (aSuccess) aSuccess(resp.data);
            },
            function(resp) {
                // invoke the callback, if any
                if (aFailure) aFailure(resp);
            }
        );
    };

    IdentityService.prototype.resetPassword = function(aPassword, aKey, aSuccess, aFailure) {
        // actually do the password change, with the associated key
        self.http({
            method: 'PUT', // TODO: get this from the links!
            url: self.nbtRoot.links().resetPassword.href,
            data: { // TODO: fill out a template that we get from the links!
                password: aPassword,
                recoveryKey: aKey
            }
        }).then(
            function(resp) {
                // invoke the callback, if any
                if (aSuccess) aSuccess(resp.data);
            },
            function(resp) {
                // invoke the callback, if any
                if (aFailure) aFailure(resp);
            }
        );
    };

    IdentityService.prototype.logout = function() {
        if (self.mIdentity) {
            var hdrs = new Headers(Header.TOKEN, self.mIdentity.value);

            self.http({
                method: 'DELETE', // TODO: get this from the links!
                url: self.mIdentity._links.logout.href,
                headers: hdrs.get()
            });
        }

        this.reset();

        // post event to any subscribers
        self.rootScope.$broadcast('nbtIdentityChanged', this.get());
    };

    IdentityService.prototype.refresh = function(aFailureCb) {
        if (self.mIdentity) {
            var hdrs = new Headers(Header.TOKEN, self.mIdentity.value);

            // attempt to refresh the token, if failed, callback on any supplied valid function
            // and clear ourselves (failure for any reason means the token is no longer valid)
            self.http({
                method: 'PUT', // TODO: get this from the links!
                url: self.mIdentity._links.refresh.href,
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

        self.http({
            method: 'POST', // TODO: get from links!
            url: self.nbtRoot.links().signup.href,
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
        if (self.mIdentity) {
            var hdrs = new Headers(Header.TOKEN, mIdentity.value);

            if (aLeague) {
                // fetch the user's profile for this league
                self.http({
                    method: 'GET', // TODO: get from links!
                    url: aLeague._links.userProfile.href,
                    headers: hdrs.get()
                }).then(function (resp) {
                    self.mCurrentProfile = resp.data;
                    self.rootScope.$broadcast('nbtProfileChanged', mCurrentProfile);
                });
            } else {
                // fetch default profile?
                http({
                    method: 'GET', // TODO: get from links!
                    url: mIdentity._links.self.href,
                    headers: hdrs.get()
                }).then(function (resp) {
                    self.mCurrentProfile = resp.data;
                    self.rootScope.$broadcast('nbtProfileChanged', mCurrentProfile);
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