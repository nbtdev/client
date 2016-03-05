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
    var mod = angular.module('nbt.app');

    mod.service('nbtToken', ['$http', '$rootScope', function($http, $rootScope) {
        var self = this;

        // token string value
        var mToken = null;
        // token user ID
        var mUserId = null;
        // link to logout rel (DELETE token)
        var mLogout = null;
        // link to refresh rel (PUT token, to reset expiry and also to test validity)
        var mRefresh = null;

        var clear = function() {
            mToken = null;
            mUserId = null;
            mLogout = null;
            mRefresh = null;

            // clear local storage too
            localStorage.removeItem('token');
        };

        this.current = function() {
            if (mToken) return mToken;
        };

        this.userId = function() {
            if (mUserId) return mUserId;
        };

        this.set = function(aData) {
            clear();

            if (aData) {
                mToken = aData.value;
                mUserId = aData.userId;
                mLogout = aData._links.logout;
                mRefresh = aData._links.refresh;

                // save ourselves to local storage
                localStorage.setItem('token', JSON.stringify({
                    value: mToken,
                    userId: mUserId,
                    logout: JSON.stringify(mLogout),
                    refresh: JSON.stringify(mRefresh)
                }))
            }

            $rootScope.$broadcast('nbtTokenChanged', self);
        };

        this.delete = function() {
            // logout the token, no need for callbacks
            $http({
                method: 'DELETE', // TODO: get this from the links!
                url: mLogout.href
            });

            clear();
        };

        this.refresh = function(aFailureCb) {
            // attempt to refresh the token, if failed, callback on any supplied valid function
            // and clear ourselves (failure for any reason means the token is no longer valid)
            $http({
                method: 'PUT', // TODO: get this from the links!
                url: mRefresh.href
            }).then(
                null, // no callback on failure
                function(resp) {
                    // kill our own data
                    clear();

                    // callback to supplied cb if valid
                    if (aFailureCb) aFailureCb();
                }
            );

            clear();
        };

        var init = function() {
            // load our data from local storage and try to refresh ourselves;
            // if that fails, we should clear ourselves normally
            if (localStorage.token) {
                var data = JSON.parse(localStorage.token);

                mToken = data.value;
                mUserId = data.userId;
                mLogout = JSON.parse(data.logout);
                mRefresh = JSON.parse(data.refresh);

                self.refresh();
            }
        };

        // init the object
        init();
    }]);
})();