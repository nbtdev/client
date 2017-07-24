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

    app.directive('nbtLeagues', function($templateRequest, $compile) {
        var self = this;

        this.controller = function ($scope, nbtLeague, nbtIdentity) {
            $scope.leagues = nbtLeague.leagues();
            self.leagueService = nbtLeague;
            self.identityService = nbtIdentity;
        };

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: true,
            controller: this.controller,
            controllerAs: 'NbtLeaguesController',
            link: function(scope, element, attrs, controller) {
                var l10n = 'en';

                if (attrs.lang) l10n = attrs.lang;

                var token = self.identityService.get().token;

                // load the leagues listing fragment
                $templateRequest('/templates/' + l10n + '/nbt-leagues/body.html').then(function(html) {
                    self.leagueService.fetchLeagues(token, function(leagues, leagueRaw) {
                        scope.leagues = leagues;
                        var content = angular.element(html);
                        element.append($compile(content)(scope));
                    });
                });
            }
        };
    });
})();