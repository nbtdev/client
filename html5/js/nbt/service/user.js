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

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtUser', ['$http', '$rootScope', 'nbtRoot', 'nbtToken', function($http, $rootScope, nbtRoot, nbtToken) {
        var mUserData = null;
        var mCurrentProfile = null;

        var clearLocalStorage = function() {
            localStorage.removeItem('login');
        };

        var reset = function() {
            // clear out any current user data object
            mUserData = null;

            // clear out any existing cached login data (local storage)
            clearLocalStorage();
        };

        this.token = function() {
            if (mUserData) return mUserData.value;
            return null;
        };

        this.profile = function() {
            if (mCurrentProfile) {
                return {
                    callsign: mCurrentProfile.callsign
                };
            }

            return null;
        };

        this.login = function(aUsername, aPassword, aSuccess, aFailure) {
            // clear out any existing user data
            reset();

            // attempt to get a token based on the provided login credentials
            $http({
                method: 'POST', // TODO: get this from the links!
                url: nbtRoot.links().login.href,
                data: { // TODO: fill out a template that we get from the links!
                    username: aUsername,
                    password: aPassword
                }
            }).then(
                function(resp) {
                    // save the new user data
                    mUserData = resp.data;

                    // save the new token data
                    nbtToken.set(resp.data);

                    // invoke the callback, if any
                    if (aSuccess) aSuccess(resp.data);
                },
                function(resp) {
                    // invoke the callback, if any
                    if (aFailure) aFailure(resp.data);
                }
            );
        };

        this.logout = function() {
            if (mUserData) {
                $http({
                    method: 'DELETE', // TODO: get this from the links!
                    url: mUserData._links.logout.href,
                    headers: {
                        'X-NBT-Token': nbtToken.current()
                    }
                });
            }
        };

        this.register = function(aRegData, aCaptchaResponse, aSuccess, aFailure) {
            // submit the new-user registration
            $http({
                method: 'POST', // TODO: get from links!
                url: nbtRoot.links().signup.href,
                data: aRegData,
                headers: {
                    'X-NBT-Captcha-Token': aCaptchaResponse
                }
            }).then(
                function(resp) {
                    if (aSuccess) aSuccess(resp.data);
                },
                function(resp) {
                    if (aFailure) aFailure(resp.data);
                }
            );
        };

        this.onLeagueChanged = function(aLeague) {
            if (aLeague) {
                // fetch the user's profile for this league
                $http({
                    method: 'GET', // TODO: get from links!
                    url: aLeague._links.profile.href,
                    headers: {
                        'X-NBT-Token': nbtToken.current()
                    }
                }).then(function (resp) {
                    // change callsign, email, etc.
                    if (mUserData) {
                        mUserData.callsign = resp.data.callsign;
                        mUserData.email = resp.data.email;
                        $rootScope.$broadcast('nbtProfileChanged', mUserData);
                    }
                });
            } else {
                // fetch default profile?
            }
        };
    }]);
})();