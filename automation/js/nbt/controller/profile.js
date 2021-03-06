/**
 Copyright (c) 2017, Netbattletech
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
    .controller('ProfileController', ['$sce', '$scope', '$timeout', 'nbtUser', 'nbtLeague', 'nbtIdentity', function($sce, $scope, $timeout, nbtUser, nbtLeague, nbtIdentity) {
        var timeoutPromise = null;
        $scope.league = null;

        var updateStatus = function(message, isError) {
            $scope.status = message;
            $scope.statusIsError = isError;

            // cause the message to go away in 5 seconds
            if (timeoutPromise)
                $timeout.cancel(timeoutPromise);

            timeoutPromise = $timeout(function() {
                $scope.status = null;
                timeoutPromise = null;
            }, 5000);
        };

        function reset() {
            $scope.profile = {};
            nbtLeague.fetchLeagueProfile($scope.league, nbtIdentity.get().token, function(data) {
                $scope.profile = data.data;
            });

            $scope.passwordMessage = null;
            $scope.passwordSuccess = false;
        }

        $("#profileModal").on("shown.bs.modal", function() {
            reset();
        });

        reset();

        $scope.onApply = function() {
            nbtUser.updateProfile($scope.profile, nbtIdentity.get().token,
                function(data) {
                    // blip that the update succeeded
                    updateStatus("Changes saved");
                },
                function(err) {
                    // blip that the update failed
                    updateStatus(err.data.message, true);
                }
            );
        };

        $scope.onCancel = function() {
            $scope.profile = {};
        };

        var validatePassword = function() {
            // TODO: for all of these strings, an i18n service maybe?

            // must be at least 8 characters
            if ($scope.newPassword.length < 8) {
                return 'Password must be at least 8 characters long';
            }

            // password needs to contain at least one of each of: uppercase, lowercase, digit, special-char
            re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\`\~\!\@\#\$\%\^\&\*\(\)]).+$/;
            if ($scope.newPassword.search(re) < 0) {
                return 'Password must contain at least: one lowercase, one uppercase, one digit, one special character';
            }

            // Compare the two password fields for equality
            if ($scope.newPassword !== $scope.newPasswordConfirm) {
                return 'Passwords do not match';
            }

            return null;
        };

        $scope.onChangePassword = function() {
            var validationError = validatePassword();

            if (validationError) {
                $scope.passwordMessage = validationError;
                $scope.passwordSuccess = false;
                return;
            }

            nbtIdentity.updatePassword(
                $scope.currentPassword,
                $scope.newPassword,
                function(data) {
                    $scope.passwordMessage = "Password successfully updated";
                    $scope.passwordSuccess = true;
                    $scope.currentPassword = null;
                    $scope.newPassword = null;
                    $scope.newPasswordConfirm = null;
                },
                function(err) {
                    $scope.passwordMessage = err.data.message;
                    $scope.passwordSuccess = false;
                }
            );
        };

        // when the user chooses a different league, we want to update out cached current-league
        var cb = $scope.$on('nbtLeagueChanged', function(event, aLeague) {
            $scope.league = aLeague;
            reset();
        });
        $scope.$on('destroy', cb);
    }]);
})();
