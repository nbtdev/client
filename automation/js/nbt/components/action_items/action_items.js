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
        .module('nbt.actionItems', [])
        .directive('nbtActionItems', function($templateRequest, $compile) {
            this.controller = function($scope, $http, nbtBattle, nbtUser, nbtIdentity) {
                var self = this;

                // when the user profile changes, we want to update the list of action items for the user
                var cb = $scope.$on('nbtProfileChanged', function(event, aData) {
                    if (aData)
                        $scope.callsign = aData.callsign;
                    else
                        $scope.callsign = null;
                });
                $scope.$on('destroy', cb);

                // it's possible that we are starting up after the above event has already been
                // fired, so check with the identity service to see if there is a profile waiting
                var profile = nbtIdentity.profile();
            };

            return {
                restrict: 'E',
                scope: true,
                controller: controller,
                controllerAs: 'actionItems',
                link: function(scope, element, attrs, controller) {

                    var i18n = 'en';

                    if (attrs.lang) i18n = attrs.lang;

                    $templateRequest('/templates/' + i18n + '/action_items/action_items.html').then(function (html) {
                        var templ = angular.element(html);
                        element.append(templ);
                        $compile(templ)(scope);

                        var elem = element[0].firstElementChild;
                    });
                }
            };
        });
})();
