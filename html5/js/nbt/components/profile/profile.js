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

        this.controller = function($scope, $attrs, $http, $sce, nbtUser) {

            var self = this;
            var mToken = null;
            var mLogoutLink = null;
            var registerForm = null;

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

            this.signInSuccess = function(userData) {
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
                $scope.passwordIncorrect = false;

                // save off the logout link
                self.mLogoutLink = userData._links.logout;

                // update token with the new value
                self.mToken = userData.value;

                // THEN...populate the league list
                self.fetchLeagueList();

                onLoginChangedCb(self.mToken);
            };

            this.signInFailed = function(data) {
                console.log(data);
                $scope.passwordIncorrect = true;
            };

            this.onSignIn = function() {
                // hide the login-error message box
                $scope.passwordIncorrect = false;

                // attempt to get a token based on the provided login credentials
                nbtUser.login($scope.username, $scope.password, self.signInSuccess, self.signInFailed);
                //$http({
                //    method: 'POST', // TODO: get this from the links!
                //    url: nbt.rootLinks().login.href,
                //    data: { // TODO: fill out a template that we get from the links!
                //        username: $scope.username,
                //        password: $scope.password
                //    }
                //})
                //    .then(self.signInSuccess, self.signInFailed);
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
                $scope.passwordIncorrect = false;

                onLoginChangedCb(self.mToken);
            };

            this.onRegister = function() {
                $scope.initialized = 1;
                $scope.isRegistering = true;
                $scope.registrationSucceeded = false;

                self.registerForm.maximize();

                $scope.usernameError = null;
                $scope.callsignError = null;
                $scope.passwordError = null;
                $scope.passwordCheckError = null;
                $scope.emailAddressError = null;
                $scope.emailAddressCheckError = null;
                $scope.captchaError = null;

                $scope.regData.username = null;
                $scope.regData.password = null;
                $scope.regData.callsign = null;
                $scope.regData.email = null;

                var path = window.location.pathname.replace('index.html', '');

                $scope.regData.activationUrl = window.location.origin + path + 'activate.html';
                $scope.regData.privacyUrl = window.location.origin + path + "privacy.html";

                $scope.emailAddressCheck = null;
                $scope.passwordCheck = null;

                if (self.recaptcha) {
                    if (self.recaptcha.childElementCount === 0 && grecaptcha) {
                        grecaptcha.render(
                            self.recaptcha,
                            {
                                sitekey: self.recaptchaKey,
                                size: 'normal'
                            }
                        );
                    } else {
                        grecaptcha.reset();
                    }
                }
            };

            this.populateProfileInfo = function(resp) {
                var profile = resp.data;
                $scope.displayName = profile.callsign;
            };

            this.onCancelRegistration = function() {
                self.closeForm();
            };

            this.closeForm = function() {
                $scope.isRegistering = false;
                $scope.usernameError = null;
                $scope.callsignError = null;
                $scope.passwordError = null;
                $scope.passwordCheckError = null;
                $scope.emailAddressError = null;
                $scope.emailAddressCheckError = null;
                $scope.captchaError = null;
                $scope.regData.username = null;
                $scope.regData.password = null;
                $scope.regData.callsign = null;
                $scope.regData.email = null;
            }

            this.validateForm = function() {
                var rtn = true;

                $scope.usernameError = null;
                $scope.callsignError = null;
                $scope.passwordError = null;
                $scope.passwordCheckError = null;
                $scope.emailAddressError = null;
                $scope.emailAddressCheckError = null;
                $scope.captchaError = null;


                // TODO: for all of these strings, an i18n service maybe?

                // 1. basic validation (are things here, are they the right format?)
                if (!$scope.regForm.$valid) {
                    if ($scope.regForm.$error.required) {
                        rtn = false;

                        // see which elements are missing and report those
                        for (var i = 0; i < $scope.regForm.$error.required.length; ++i) {
                            var missing = $scope.regForm.$error.required[i];
                            $scope[missing.$name + 'Error'] = 'Field Required';
                        }
                    }

                    if ($scope.regForm.$error.email) {
                        rtn = false;

                        // see which elements are invalid and report those
                        for (var i = 0; i < $scope.regForm.$error.email.length; ++i) {
                            var invalid = $scope.regForm.$error.email[i];
                            $scope[invalid.$name + 'Error'] = 'Incorrect email address format';
                        }
                    }

                    if ($scope.regForm.$error.minlength) {
                        rtn = false;

                        // see which elements are too short and report those
                        for (var i = 0; i < $scope.regForm.$error.minlength.length; ++i) {
                            var tooShort = $scope.regForm.$error.minlength[i];
                            $scope[tooShort.$name + 'Error'] = 'Must be at least 8 characters in length';
                        }
                    }

                    return false;
                }

                // 2. Second-level checks -- check login, callsign and password for valid contents
                // login can contain only alphanum and underscore
                var re = /^[a-zA-Z0-9_]*$/;
                if ($scope.regData.username.search(re) < 0) {
                    $scope.usernameError = 'Username contains illegal characters';
                    rtn = false;
                }

                // password needs to contain at least one of each of: uppercase, lowercase, digit, special-char
                re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\`\~\!\@\#\$\%\^\&\*\(\)]).+$/;
                if ($scope.regData.password.search(re) < 0) {
                    $scope.passwordError = 'Password must contain at least: one lowercase, one uppercase, one digit, one special character';
                    rtn = false;
                }

                // 3. Compare the two password fields for equality
                if ($scope.regData.password !== $scope.passwordCheck) {
                    $scope.passwordCheckError = 'Passwords do not match!';
                    rtn = false;
                }

                // 3. Compare the two email fields for equality
                if ($scope.regData.email !== $scope.emailAddressCheck) {
                    $scope.emailAddressCheckError = 'Email addresses do not match!';
                    rtn = false;
                }

                // 4. has the user solved the captcha?
                try {
                    // failure to access any of these will throw, and we catch that into a 'false'
                    if (grecaptcha.getResponse().length === 0)
                        throw new Exception();
                } catch(e) {
                    $scope.captchaError = "reCaptcha must be solved before submitting!";
                    rtn = false;
                }

                return rtn;
            };

            this.registrationSucceeded = function(data) {
                console.log(data);
                $scope.registrationSucceeded = true;
                grecaptcha.reset();
            };

            this.registrationFailed = function(data) {
                // tell the user what the problems were
                if (data.data.message.includes('[username]')) {
                    $scope.usernameError = 'Username already taken!';
                } else if (data.data.message.includes('[callsign]')) {
                    $scope.callsignError = 'Callsign already taken!';
                } else if (data.data.message.includes('[email]')) {
                    $scope.emailAddressError = 'Email address already used!';
                }

                $scope.registrationSucceeded = false;
                grecaptcha.reset();
            };

            this.onSubmitRegistration = function() {
                if (self.validateForm()) {
                    $scope.errorMessage = null;

                    // submit the new-user registration
                    $http({
                        method: 'POST', // TODO: get from links!
                        url: nbt.rootLinks().signup.href,
                        data: $scope.regData,
                        headers: {
                            'X-NBT-Captcha-Token': grecaptcha.getResponse()
                        }
                    }).then(self.registrationSucceeded, self.registrationFailed);
                } else {
                    // tell the user there were errors and to fix them first
                    // TODO: i18n?
                    $scope.errorMessage = "Registration form contains errors, please correct these and re-submit";
                }
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
            };

            this.onPrivacy = function() {
                if ($scope.privacyPolicy)
                    $scope.privacyPolicy = null;
                else
                $scope.privacyPolicy = $sce.trustAsHtml(
                        "<p>" +
                        "We don't give your email address to anyone. We don't sell anything " +
                        "or solicit for anything. However, we do need your email address in order " +
                        "to send you notifications from the automation. " +
                        "</p><p>" +
                        "You will be able to opt out of any/all notifications via your User Profile." +
                        "</p>"
                );
            };

            this.onLeagueChanged = function() {
                self.selectedLeague = $scope.selectedLeague;
                localStorage.selectedLeague = self.selectedLeague;
                onLeagueChangedCb(self.selectedLeague);
                self.changeProfileInfo();
            };

            this.setRegisterForm = function(elem) {
                self.registerForm = elem;
                elem.maximize = maximize;
                elem.minimize = minimize;
                self.recaptcha = elem.querySelector('.g-recaptcha');
                self.recaptchaKey = self.recaptcha.dataset.sitekey;
            };

            var minimize = function(elem) {
                // make the element take up zero space on the screen (remove any 'fullscreen' and 'onTop'
                // class names and replace them with 'minimized' and 'onBottom')
                var arr = this.className.split(' ');

                idx = arr.indexOf('onTop');
                if (idx >= 0)
                    arr.splice(idx, 1);

                idx = arr.indexOf('fullscreen');
                if (idx >= 0)
                    arr.splice(idx, 1);

                this.className = arr.join(' ') + ' minimized onBottom';
            };

            var maximize = function() {
                // make the element take up the full screen (remove any 'minimized' and 'onBottom'
                // class names and replace them with 'fullscreen' and 'onTop')
                var arr = this.className.split(' ');

                idx = arr.indexOf('onBottom');
                if (idx >= 0)
                    arr.splice(idx, 1);

                idx = arr.indexOf('minimized');
                if (idx >= 0)
                    arr.splice(idx, 1);

                this.className = arr.join(' ') + ' fullscreen onTop';
            };

            // check for any existing login data, and if it exists, set our initial
            // data to it
            if (this.loginData) {
                this.mToken = this.loginData.login.value;
                self.mLogoutLink = this.loginData.logout;
                $scope.displayName = this.loginData.login.callsign;
                $scope.passwordIncorrect = false;
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
                $scope.passwordIncorrect = false;
                $scope.username = null;
                $scope.password = null;
            }

            $scope.initialized = 0;

            $scope.regData = {
                username: null,
                callsign: null,
                password: null,
                email: null,
                activationUrl: null
            };

            // extremely hacky...
            window.addEventListener("transitionend", function(event) {
                if (event.srcElement === self.registerForm) {
                    // only do this if 'fadeOut' exists in the class name list
                    if (event.srcElement.className.indexOf('fadeOut') > 0) {
                        event.srcElement.minimize();
                    }
                }
            });
        };

        return {
            restrict: 'E',
            scope: true,
            controller: controller,
            controllerAs: 'profile',
            link: function(scope, element, attrs, controller) {
                onLeagueChangeAttr = attrs.onleaguechanged;
                onLoginChangeAttr = attrs.onloginchanged;

                var i18n = 'en';

                if (attrs.lang) i18n = attrs.lang;

                $templateRequest('/templates/' + i18n + '/profile/profile.html').then(function (html) {
                    var templ = angular.element(html);
                    element.append(templ);
                    $compile(templ)(scope);

                    var elem = element[0].firstElementChild;
                    var registerForm = elem.children[2];
                    controller.setRegisterForm(registerForm);
                });
            }
        };
    });
})();
