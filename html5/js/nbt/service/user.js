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

    mod.service('nbtUser', ['$http', 'nbtRoot', '$rootScope', function($http, nbtRoot, $rootScope) {
        var mToken = null;

        this.token = function() { return mToken; };

        var signInSuccess = function(resp) {
            $rootScope.$broadcast('loginSuccess', resp.data);
        };

        var signInFailed = function(resp) {
            $rootScope.$broadcast('loginFailed', resp.data);
        };

        this.login = function(aUsername, aPassword) {
            // attempt to get a token based on the provided login credentials
            $http({
                method: 'POST', // TODO: get this from the links!
                url: nbtRoot.links().login.href,
                data: { // TODO: fill out a template that we get from the links!
                    username: aUsername,
                    password: aPassword
                }
            }).then(signInSuccess, signInFailed);
        };
    }]);
})();