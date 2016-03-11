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
    var app = angular.module('nbt.app');

    app.controller('SideMenuController', ['$scope', 'nbtIdentity', function($scope, nbtIdentity) {
        var mIdentity = null;

        // TODO: GET FROM i18N SERVICE
        $scope.strings = {
            SETTINGS: 'Site Control Panel',
            USER_MANAGEMENT: 'Manage Users'
        };

        function update() {
            $scope.isSiteAdmin = mIdentity ? mIdentity.isSiteAdmin() : false;
            $scope.isLeagueAdmin = mIdentity ? mIdentity.isLeagueAdmin() : false;
            $scope.isTeamAdmin = mIdentity ? mIdentity.isTeamAdmin() : false;
            $scope.isLoggedIn = mIdentity ? mIdentity.token : false;

            if ($scope.isSiteAdmin) $scope.strings.SETTINGS = 'Site Control Panel';
            else if ($scope.isLeagueAdmin) $scope.strings.SETTINGS = 'League Control Panel';
            else if ($scope.isTeamAdmin) $scope.strings.SETTINGS = 'Faction Control Panel';
            else $scope.strings.SETTINGS = 'Preferences';
        }

        var cb = $scope.$on('nbtIdentityChanged', function(event, identity) {
            mIdentity = identity;
            update();
        });
        $scope.$on('destroy', cb);

        mIdentity = nbtIdentity.get();
        update();
    }]);
})();

