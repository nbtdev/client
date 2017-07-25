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
    angular
    .module('nbt.app')
    .controller('SigninFormController', ['$sce', '$scope', 'nbtUser', 'nbtLeague', 'nbtIdentity', function($sce, $scope, nbtUser, nbtLeague, nbtIdentity) {
        var self = this;

        var resetError = function() {
            $scope.needsCaptcha = false;
            $scope.captchaError = null;
            $scope.signinError = null;
        };

        function reset() {
            // form model data
            $scope.username = null;
            $scope.password = null;

            resetError();
        }

        this.signinSucceeded = function(data) {
            console.log(data);
            $scope.signinSucceeded = true;
            grecaptcha.reset();
            $('#signinModal').modal('hide');
            reset();

            // trigger a reload of the profile for this user in this league
            nbtLeague.fetchLeagues(nbtIdentity.get().token, function(leagues, leaguesRaw) {

            });
        };

        this.signinFailed = function(data) {
            $scope.signinSucceeded = false;
            $scope.signinError = "Username or password do not match our records, please try again";
            grecaptcha.reset();
        };

        var onSignin = function() {
            nbtIdentity.login(
                $scope.username,
                $scope.password,
                self.signinSucceeded,
                self.signinFailed
            );
        };

        $scope.onSignin = onSignin;

        $scope.onCancel = function() {
            reset();
        };

        this.closeForm = function() {
            reset();
        };

        $scope.checkEnterKey = function(event) {
            var code = event.which || event.keyCode;
            if (code === 13) {
                onSignin();
            }
        };
    }]);
})();
