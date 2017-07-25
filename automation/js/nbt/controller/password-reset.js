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
        .controller('PasswordResetController', ['$sce', '$scope', 'nbtIdentity', function($sce, $scope, nbtIdentity) {
            var reset = function() {
                $scope.success = false;
                $scope.message = null;
                $scope.username = null;
                $scope.closeButtonText = "Cancel";
            };

            var requestSucceeded = function(data) {
                $scope.success = true;
                $scope.message = "Request submitted. An email with instructions to reset your password has been sent to the address associated with the default profile for this account. You may close this form now";
                $scope.username = null;
                $scope.closeButtonText = "Close";
            };

            var requestFailed = function(data) {
                $scope.success = false;
                $scope.message = data;
            };

            var onSubmit = function() {
                $scope.success = false;
                $scope.message = null;

                if (!$scope.username) {
                    $scope.success = false;
                    $scope.message = "Username must be provided";
                    return;
                }

                nbtIdentity.requestPasswordReset(
                    $scope.username,
                    window.location.origin  + '/reset-password.html',
                    requestSucceeded,
                    requestFailed
                );
            };

            $scope.onSubmit = onSubmit;

            $scope.onCancel = function() {
                reset();
            };

            $scope.checkEnterKey = function(event) {
                var code = event.which || event.keyCode;
                if (code === 13) {
                    onSubmit();
                }
            };

            reset();
        }]);
})();
