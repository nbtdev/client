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

var _UserService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var nbtRoot = null;
    var nbtLeague = null;
    var mUsersCache = [];

    function UserService(aHttp, aRootScope, aNbtRoot) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
        nbtRoot = aNbtRoot;
    }

    // load the detail for a battle on a particular planet
    UserService.prototype.fetchUsers = function (aFilter, aToken, aCallback, aFailCb, aFinallyCb) {
        var hdr = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: nbtRoot.systemLinks().users.href,
            headers: hdr.get()
        }).then(
            function (aResp) {
                mUsersCache = aResp.data._embedded.users;
                if (aCallback) {
                    var users = [];

                    var data = mUsersCache;
                    for (var i=0; i<data.length; ++i) {
                        var u = data[i];
                        users.push({
                            id: u.id,
                            login: u.username,
                            status: u.status
                        });
                    }

                    aCallback(users);
                }
            },
            function(aResp) {
                //aFailCb(aResp.data.error + " (code: " + aResp.data.status + ")");
                aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
            }
        ).finally(aFinallyCb);
    };

    UserService.prototype.add = function(aUser, aToken, aSuccessCb, aFailCb, aFinallyCb) {
        if (!aUser) return;

        var hdr = new Headers(Header.TOKEN, aToken);

        http({
            method: 'POST', // TODO: GET FROM LINKS!
            url: nbtRoot.systemLinks().users.href,
            headers: hdr.get(),
            data: {
                username: aUser.login,
                callsign: aUser.callsign,
                email: aUser.email,
                activationUrl: aUser.activationUrl,
                privacyUrl: aUser.privacyUrl
            }
        }).then(
            function (aResp) {
                self.fetchUsers(null, aToken, aSuccessCb);
            },
            function(aResp) {
                //aFailCb(aResp.data.error + " (code: " + aResp.data.status + ")");
                aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
            }
        ).finally(aFinallyCb);
    };

    UserService.prototype.delete = function(aUser, aToken, aSuccessCb, aFailCb, aFinallyCb) {
        if (!aUser) return;

        var hdr = new Headers(Header.TOKEN, aToken);

        // find the user record
        var user = null;
        for (var i=0; i<mUsersCache.length; ++i) {
            if (mUsersCache[i].id === aUser.id) {
                user = mUsersCache[i];
                break;
            }
        }

        if (user) {
            http({
                method: 'DELETE', // TODO: GET FROM LINKS!
                url: user._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    self.fetchUsers(null, aToken, aSuccessCb);
                },
                function(aResp) {
                    //aFailCb(aResp.data.error + " (code: " + aResp.data.status + ")");
                    aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
                }
            ).finally(aFinallyCb);
        } else {
            if (aFailCb) {
                aFailCb("User account not found");
            }
        }
    };

    UserService.prototype.update = function(aUser, aToken, aSuccessCb, aFailCb, aFinallyCb) {
        if (!aUser) return;

        var hdr = new Headers(Header.TOKEN, aToken);

        // find the user record
        var user = null;
        for (var i=0; i<mUsersCache.length; ++i) {
            if (mUsersCache[i].id === aUser.id) {
                user = mUsersCache[i];
                break;
            }
        }

        if (user) {
            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: user._links.self.href,
                headers: hdr.get(),
                data: {
                    username: aUser.login,
                    userStatus: aUser.status
                }
            }).then(
                function (aResp) {
                    aSuccessCb();
                },
                function(aResp) {
                    //aFailCb(aResp.data.error + " (code: " + aResp.data.status + ")");
                    aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
                }
            ).finally(aFinallyCb);
        } else {
            if (aFailCb) {
                aFailCb("User account not found");
            }
        }
    };

    UserService.prototype.checkUsername = function(aUsername, aToken, aSuccessCb, aFailCb, aFinallyCb) {
        if (!aUsername) return;

        var hdr = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: nbtRoot.systemLinks().users.href + "?existsCheck=1&username=" + encodeURIComponent(aUsername),
            headers: hdr.get()
        }).then(
            function (aResp) {
                aSuccessCb(aResp.data);
            },
            function(aResp) {
                aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
            }
        ).finally(aFinallyCb);
    };

    UserService.prototype.checkCallsign = function(aCallsign, aLeagueId, aToken, aSuccessCb, aFailCb, aFinallyCb) {
        if (!aCallsign) return;

        var hdr = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: nbtRoot.systemLinks().users.href + "?existsCheck=1&leagueId=" + aLeagueId + "&callsign=" + encodeURIComponent(aCallsign),
            headers: hdr.get()
        }).then(
            function (aResp) {
                aSuccessCb(aResp.data);
            },
            function(aResp) {
                if (aFailCb) aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
            }
        ).finally(aFinallyCb);
    };

    UserService.prototype.checkEmailAddress = function(aEmail, aToken, aSuccessCb, aFailCb, aFinallyCb) {
        if (!aEmail) return;

        var hdr = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: nbtRoot.systemLinks().users.href + "?existsCheck=1&email=" + encodeURIComponent(aEmail),
            headers: hdr.get()
        }).then(
            function (aResp) {
                aSuccessCb(aResp.data);
            },
            function(aResp) {
                aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
            }
        ).finally(aFinallyCb);
    };

    UserService.prototype.updateProfile = function(aProfile, aToken, aSuccessCb, aFailCb) {
        var hdr = new Headers(Header.TOKEN, aToken);

        http({
            method: 'PUT', // TODO: GET FROM LINKS!
            url: aProfile._links.self.href,
            headers: hdr.get(),
            data: aProfile
        }).then(
            function (aResp) {
                if (aSuccessCb)
                    aSuccessCb(aResp.data);
            },
            function(aResp) {
                if (aFailCb)
                    aFailCb(aResp.data.message + " (code: " + aResp.data.status + ")");
            }
        );
    };

    return UserService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtUser', ['$http', '$rootScope', 'nbtRoot', function($http, $rootScope, nbtRoot) {
        return new _UserService($http, $rootScope, nbtRoot);
    }]);
})();