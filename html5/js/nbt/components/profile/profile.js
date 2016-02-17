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
    var mod = angular.module('nbt.profile', []);

    var loadSelectedLeague = function() {
        if (localStorage.selectedLeague)
            return localStorage.selectedLeague;

        return null;
    };

    var saveSelectedLeague = function(aSelectedLeague) {
        localStorage.setItem('selectedLeague', aSelectedLeague);
    };

    var loadLogin = function() {
        var loginObj = null;
        var logoutLink = null;

        if (localStorage.login)
            loginObj = JSON.parse(localStorage.login);

        if (localStorage.logout)
            logoutLink = localStorage.logout;

        if (loginObj !== null && logoutLink !== null)
            return {login: loginObj, logout: logoutLink};
        else
            return null;
    };

    var saveLogin = function(aLogin, aLogoutLink) {
        localStorage.setItem('login', JSON.stringify(aLogin));
        localStorage.setItem('logout', aLogoutLink);
    };

    mod.directive('profile', function($templateRequest, $compile) {
        var onLeagueChangeAttr = null;
        var onLoginChangeAttr = null;

        this.controller = function($scope, $attrs, $http) {

            var self = this;
            var mToken = null;
            var mLogoutLink = null;

            this.leagues = [];
            this.selectedLeague = loadSelectedLeague();
            this.loginData = loadLogin();

            var onLeagueChangedCb = function(aSelectedLeagueUrl) {
                if (onLeagueChangeAttr) {
                    var expr = onLeagueChangeAttr + '(\'' + aSelectedLeagueUrl + '\')';
                    eval(expr);
                }
            };

            var onLoginChangedCb = function(aToken) {
                if (onLoginChangeAttr) {
                    var expr = onLoginChangeAttr + '(\'' + aToken + '\')';
                    eval(expr);
                }
            };

            this.populateLeagueList = function(resp) {
                self.leagues = resp.data._embedded.leagues;
                $scope.leagues = self.leagues;

                if (self.selectedLeague) {
                    $scope.selectedLeague = self.selectedLeague;

                    // have to set any existing token value before doing league-changed callback
                    onLoginChangedCb(self.loginData.login.value);

                    onLeagueChangedCb(self.selectedLeague);
                    self.changeProfileInfo();
                }
            };

            this.fetchLeagueList = function() {
                $http({
                    method: 'GET', // TODO: get from links!
                    url: nbt.rootLinks().leagues.href,
                    headers: {
                        'X-NBT-Token': self.mToken
                    }
                }).then(self.populateLeagueList);
            }

            this.signInSuccess = function(resp) {
                var userData = resp.data;

                // store the token in userdata
                saveLogin(userData, userData._links.logout.href);

                // update the loginData object reference
                self.loginData = {login: userData, logout: userData._links.logout.href};

                // update the UI to reflect
                $scope.displayName = userData.callsign;
                $scope.twitter = null;
                $scope.isLoggedIn = true;
                $scope.password = null;
                $scope.username = null;

                // save off the logout link
                self.mLogoutLink = userData._links.logout;

                // update token with the new value
                self.mToken = userData.value;

                // THEN...populate the league list
                self.fetchLeagueList();

                onLoginChangedCb(self.mToken);
            };

            this.signInFailed = function(resp) {
                console.log(resp.data);
            };

            this.onSignIn = function() {
                // attempt to get a token based on the provided login credentials
                $http({
                    method: 'POST', // TODO: get this from the links!
                    url: nbt.rootLinks().login.href,
                    data: { // TODO: fill out a template that we get from the links!
                        username: $scope.username,
                        password: $scope.password
                    }
                })
                    .then(self.signInSuccess, self.signInFailed);
            };

            this.onSignOut = function() {
                // DELETE the existing token and null out any stored login data
                $http({
                    method: 'DELETE', // TODO: get this from the links!
                    url: self.mLogoutLink.href,
                    headers: {
                        'X-NBT-Token': self.mToken
                    }
                });

                // blow away any existing login data
                localStorage.removeItem('login');
                localStorage.removeItem('logout');
                //localStorage.removeItem('selectedLeague');
                self.mToken = null;

                // update the UI to reflect
                $scope.displayName = null;
                $scope.twitter = null;
                $scope.isLoggedIn = false;
                $scope.password = null;
                $scope.username = null;

                onLoginChangedCb(self.mToken);
            };

            this.onRegister = function() {
            };

            this.populateProfileInfo = function(resp) {
                var profile = resp.data;
                $scope.displayName = profile.callsign;
            };

            this.changeProfileInfo = function() {
                // figure out the proper profile to fetch for the user display information
                for (var i=0; i<self.leagues.length; ++i) {
                    var l = self.leagues[i];
                    if (l._links.self.href !== self.selectedLeague)
                        continue;

                    // otherwise, fetch the user's profile for this league
                    $http({
                        method: 'GET', // TODO: get from links!
                        url: l._links.profile.href,
                        headers: {
                            'X-NBT-Token': self.mToken
                        }
                    }).then(self.populateProfileInfo);
                }
            }

            this.onLeagueChanged = function() {
                self.selectedLeague = $scope.selectedLeague;
                localStorage.selectedLeague = self.selectedLeague;
                onLeagueChangedCb(self.selectedLeague);
                self.changeProfileInfo();
            };

            // check for any existing login data, and if it exists, set our initial
            // data to it
            if (this.loginData) {
                this.mToken = this.loginData.login.value;
                self.mLogoutLink = this.loginData.logout;
                $scope.displayName = this.loginData.login.callsign;
                $scope.twitter = null;
                $scope.isLoggedIn = true;
                $scope.username = null;
                $scope.password = null;

                // fetch league list to populate the dropdown
                this.fetchLeagueList();
            } else {
                this.mToken = null;
                $scope.displayName = null;
                $scope.twitter = null;
                $scope.isLoggedIn = false;
                $scope.username = null;
                $scope.password = null;
            }
        };

        return {
            restrict: 'E',
            scope: true,
            controller: controller,
            controllerAs: 'profile',
            link: function(scope, element, attrs, controller) {
                var i18n = 'en';

                if (attrs.lang) i18n = attrs.lang;

                $templateRequest('/templates/' + i18n + '/profile/profile.html').then(function (html) {
                    var templ = angular.element(html);
                    element.append(templ);
                    $compile(templ)(scope);
                });

                onLeagueChangeAttr = attrs.onleaguechanged;
                onLoginChangeAttr = attrs.onloginchanged;
            }
        };
    });
})();
