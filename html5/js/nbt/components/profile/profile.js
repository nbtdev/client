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

    mod.directive('profile', function($templateRequest, $compile) {

        this.controller = function($scope, $attrs, $http, $sce, nbtIdentity, nbtRoot, nbtLeague) {
            var self = this;

            var resetRegistration = function() {
                $scope.registrationSucceeded = false;

                $scope.passwordCheck = null;
                $scope.emailAddressCheck = null;

                $scope.regData = {
                    username: null,
                    callsign: null,
                    password: null,
                    email: null,
                    activationUrl: null
                };
            };

            var resetError = function() {
                $scope.usernameError = null;
                $scope.callsignError = null;
                $scope.passwordError = null;
                $scope.passwordCheckError = null;
                $scope.emailAddressError = null;
                $scope.emailAddressCheckError = null;
                $scope.captchaError = null;
            };

            var reset = function() {
                resetRegistration();
                resetError();

                $scope.selectedLeague = "0";
                $scope.initialized = null;
                $scope.isRegistering = false;
                $scope.callsign = null;
                $scope.twitter = null;
                $scope.isLoggedIn = false;
                $scope.password = null;
                $scope.username = null;
                $scope.passwordIncorrect = false;
            };

            var populateLeagueList = function() {
                var leagues = nbtLeague.leagues();
                $scope.leagues = leagues;
            };

            this.signInSuccess = function(userData) {
                // update the UI to reflect
                $scope.callsign = userData.callsign;
                $scope.twitter = null;
                $scope.isLoggedIn = true;
                $scope.password = null;
                $scope.username = null;
                $scope.passwordIncorrect = false;

                // THEN...populate the league list
                populateLeagueList();
            };

            this.signInFailed = function(data) {
                $scope.passwordIncorrect = true;
            };

            this.onSignIn = function() {
                // hide the login-error message box
                $scope.passwordIncorrect = false;

                // attempt to get a token based on the provided login credentials
                nbtIdentity.login($scope.username, $scope.password, self.signInSuccess, self.signInFailed);
            };

            this.onSignOut = function() {
                nbtIdentity.logout();
                reset();
            };

            this.onRegister = function() {
                resetRegistration();
                $scope.initialized = 1;
                $scope.isRegistering = true;

                self.registerForm.maximize();

                var path = window.location.pathname.replace('index.html', '');

                $scope.regData.activationUrl = window.location.origin + path + 'activate.html';
                $scope.regData.privacyUrl = window.location.origin + path + "privacy.html";

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

            this.onCancelRegistration = function() {
                self.closeForm();
            };

            this.closeForm = function() {
                reset();
                self.registerForm.minimize();
            }

            this.validateForm = function() {
                var rtn = true;

                resetError();

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
                if (data.message.includes('[username]')) {
                    $scope.usernameError = 'Username already taken!';
                } else if (data.message.includes('[callsign]')) {
                    $scope.callsignError = 'Callsign already taken!';
                } else if (data.message.includes('[email]')) {
                    $scope.emailAddressError = 'Email address already used!';
                }

                $scope.registrationSucceeded = false;
                grecaptcha.reset();
            };

            this.onSubmitRegistration = function() {
                if (self.validateForm()) {
                    nbtIdentity.register(
                        $scope.regData,
                        grecaptcha.getResponse(),
                        self.registrationSucceeded,
                        self.registrationFailed
                    );
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

            // when user makes a new selection in the league dropdown, let the league
            // service know
            this.onLeagueChanged = function() {
                nbtLeague.setCurrent(parseInt($scope.selectedLeague), nbtIdentity.get().token);
            };

            // if the selected league changes in the league service, update the
            // profile widget to reflect the new selection
            var cb = $scope.$on('nbtProfileChanged', function(event, aData) {
                if (aData)
                    $scope.callsign = aData.callsign;
                else
                    $scope.callsign = null;
            });
            $scope.$on('destroy', cb);

            // when the user identity changes (login or logout, for example), update
            // the scope to reflect this
            cb = $scope.$on('nbtIdentityChanged', function(event, aIdent) {
                if (aIdent.token) {
                    $scope.isLoggedIn = true;
                    nbtLeague.fetchLeagues(aIdent.token);
                } else {
                    $scope.isLoggedIn = false;
                    $scope.leagues = null;
                }
            });
            $scope.$on('destroy', cb);

            // when the list of leagues changed, we want to update our droplist
            cb = $scope.$on('nbtLeaguesChanged', function(event, aLeagues) {
                $scope.leagues = aLeagues;

                var currentLeague = nbtLeague.current();
                if (currentLeague)
                    $scope.selectedLeague = currentLeague.id().toString();
            });
            $scope.$on('destroy', cb);

            // called by directive link function once we know what our elements are
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

            reset();
            $scope.initialized = 0;

            // ask the identity service to restore from local storage
            nbtIdentity.restore();

            // if the identity service already has a valid identity,
            // init the profile as such
            var ident = nbtIdentity.get();
            if (ident.token) {
                $scope.isLoggedIn = true;
                nbtLeague.fetchLeagues(ident.token);
            }

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
