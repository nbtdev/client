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
        .controller('RegistrationFormController', ['$sce', '$scope', 'nbtUser', 'nbtLeague', 'nbtIdentity', function($sce, $scope, nbtUser, nbtLeague, nbtIdentity) {
            var self = this;
            var captchaResponse = null;
            $scope.emailCopy = null;

            var resetError = function() {
                $scope.usernameError = null;
                $scope.callsignError = null;
                $scope.passwordError = null;
                $scope.passwordCheckError = null;
                $scope.emailAddressError = null;
                $scope.emailAddressCheckError = null;
                $scope.captchaError = null;
                $scope.generalError = null;
            };

            var resetFields = function () {
                $scope.registrationSucceeded = false;
                $scope.usernameTaken = false;
                $scope.callsignTaken = false;
                $scope.passwordOk = false;
                $scope.emailTaken = false;

                // form model data
                $scope.username = null;
                $scope.callsign = null;
                $scope.password = null;
                $scope.passwordCheck = null;
                $scope.email = null;
                $scope.emailAddressCheck = null;
            };

            var reset = function() {
                resetFields();
                resetError();

                var recaptchas = $('.g-recaptcha');
                if (recaptchas) {
                    recaptchas.empty();

                    for (var i=0; i<recaptchas.length; ++i) {
                        var recaptcha = recaptchas[i];
                        var recaptchaKey = recaptcha.dataset.sitekey;

                        grecaptcha.render(
                            recaptcha,
                            {
                                sitekey: recaptchaKey,
                                size: 'normal',
                                callback: function(response) {
                                    captchaResponse = response;
                                }
                            }
                        );
                    }
                }
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
                if ($scope.username.search(re) < 0) {
                    $scope.usernameError = 'Username contains illegal characters';
                    rtn = false;
                }

                // password needs to contain at least one of each of: uppercase, lowercase, digit, special-char
                re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\`\~\!\@\#\$\%\^\&\*\(\)]).+$/;
                if ($scope.password.search(re) < 0) {
                    $scope.passwordError = 'Password must contain at least: one lowercase, one uppercase, one digit, one special character';
                    rtn = false;
                }

                // 3. Compare the two password fields for equality
                if ($scope.password !== $scope.passwordCheck) {
                    $scope.passwordCheckError = 'Passwords do not match!';
                    rtn = false;
                }

                // 3. Compare the two email fields for equality
                if ($scope.email !== $scope.emailAddressCheck) {
                    $scope.emailAddressCheckError = 'Email addresses do not match!';
                    rtn = false;
                }

                // 4. has the user solved the captcha?
                try {
                    // failure to access any of these will throw, and we catch that into a 'false'
                    if (!captchaResponse)
                        throw new Exception();

                    if (captchaResponse.length === 0)
                        throw new Exception();
                } catch(e) {
                    $scope.captchaError = "reCaptcha must be solved before submitting!";
                    rtn = false;
                }

                return rtn;
            };

            $scope.onPrivacy = function() {
                if ($scope.privacyPolicy)
                    $scope.privacyPolicy = null;
                else
                    $scope.privacyPolicy = $sce.trustAsHtml(
                        '<div style="text-align: center"><p>' +
                        'We don\'t give your email address to anyone. We don\'t sell anything ' +
                        'or solicit for anything. However, we do need your email address in order ' +
                        'to send you notifications from the automation. ' +
                        '</p><p>' +
                        'You will be able to opt out of any/all notifications via your User Profile.' +
                        '</p></div>'
                    );
            };

            this.registrationSucceeded = function(data) {
                $scope.emailCopy = $scope.email;
                resetFields();
                resetError();
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
                } else {
                    $scope.generalError = data.message;
                }

                $scope.registrationSucceeded = false;
                grecaptcha.reset();
            };

            var onSubmitRegistration = function() {
                if (self.validateForm()) {
                    var path = window.location.pathname.replace('index.html', '');

                    nbtIdentity.register(
                        {
                            username: $scope.username,
                            callsign: $scope.username,
                            password: $scope.password,
                            email: $scope.email,
                            activationUrl: window.location.origin  + '/activate.html',
                            privacyUrl: window.location.origin  + '/privacy.html'
                        },
                        captchaResponse,
                        self.registrationSucceeded,
                        self.registrationFailed
                    );
                }
            };

            $scope.onSubmitRegistration = onSubmitRegistration;

            $scope.onCancelRegistration = function() {
                resetFields();
                resetError();
            };

            this.closeForm = function() {
                resetFields();
                resetError();
            };

            $scope.checkEnterKey = function(event) {
                var code = event.which || event.keyCode;
                if (code === 13) {
                    onSubmitRegistration();
                }
            };

            $scope.$watch(
                'username',
                function(newValue, oldValue) {
                    nbtUser.checkUsername(
                        newValue,
                        nbtIdentity.get().token,
                        function(result) {
                            $scope.usernameTaken = result;

                            if (result.exists) {
                                $scope.usernameError = 'Username already taken';
                            } else {
                                $scope.usernameError = null;
                            }
                        }
                    );
                }
            );

            //$scope.$watch(
            //    'callsign',
            //    function(newValue, oldValue) {
            //        nbtUser.checkCallsign(
            //            newValue,
            //            nbtLeague.current().id,
            //            nbtIdentity.get().token,
            //            function(result) {
            //                $scope.callsignTaken = result;
            //            }
            //        );
            //    }
            //);

            $scope.$watch(
                'email',
                function(newValue, oldValue) {
                    nbtUser.checkEmailAddress(
                        newValue,
                        nbtIdentity.get().token,
                        function(result) {
                            $scope.emailTaken = result;

                            if (result.exists) {
                                $scope.emailAddressError = 'Email address already used';
                            } else {
                                $scope.emailAddressError = null;
                            }
                        }
                    );
                }
            );

            reset();
        }]);
})();
