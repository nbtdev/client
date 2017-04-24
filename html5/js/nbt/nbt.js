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

var UserRole = {
    SITE_ADMIN: 0,
    DEVELOPER: 1,
    PRECENTOR: 2,
    DEMI_PRECENTOR: 3,
    TEAM_LEADER: 4,
    TEAM_MEMBER: 5,
    GUEST: 6,
    ANONYMOUS: 7
};

// supported locales
var Locale = {
    EN: 'en'
};

// root API url
var API_URL = 'http://api.home.lan';
//var API_URL = 'http://tsunami:8080';
//var API_URL = 'http://api-dev.netbattletech.com';


function NBT() {
    var self = this;
    //var app = angular.module('nbt.app', []);
    var app = angular.module('nbt.app', []);

    // allow external code to do something after bootstrap
    this.onbootstrap = null;

    this.app = function() {
        return app;
    };

    // thanks for this bootstrap code goes out to https://blog.mariusschulz.com/2014/10/22/asynchronously-bootstrapping-angularjs-applications-with-server-side-data
    this.init = function(nbtRoot) {
        self.mInitializing = true;

        nbtRoot.init(doBootstrap);

        function doBootstrap() {
            angular.element(document).ready(function () {
                angular.bootstrap(document, ['nbt.app']);
                self.mInitializing = false;

                if (self.onbootstrap) self.onbootstrap();
            });
        }
    };
}

var _NbtRootService = (function() {
    var mLocale = Locale.EN;

    var mRootLinks = null;

    var mSystemLinks = null;
    var mFactionClass = null;
    var mFactionStatus = null;
    var mUserStatus = null;
    var mStar = null;
    var mTerrainClass = null;

    var http = null;

    function NbtRoot(aHttp) {
        http = aHttp;
    }

    NbtRoot.prototype = {
        links: function () {
            return mRootLinks;
        },

        systemLinks: function () {
            return mSystemLinks;
        },

        factionClass: function () {
            return mFactionClass;
        },

        factionStatus: function () {
            return mFactionStatus;
        },

        userStatus: function () {
            return mUserStatus;
        },

        star: function () {
            return mStar;
        },

        terrainClass: function () {
            return mTerrainClass;
        },

        setLocale: function (aLocale) {
            // TODO: verify that it's a supported one
            mLocale = aLocale;
        },

        locale: function () {
            return mLocale;
        },

        init: function (cb) {
            function ifInitalizedThenCb() {
                if (mRootLinks &&
                    mSystemLinks &&
                    mFactionClass &&
                    mFactionStatus &&
                    mUserStatus &&
                    mStar &&
                    mTerrainClass
                ) {
                    cb();
                }
            }

            // call to the API to get the root links
            http.get(API_URL).then(
                function (response) {
                    mRootLinks = response.data._links;

                    // call to the API to get the system links
                    http.get(mRootLinks.system.href).then(
                        function (response) {
                            mSystemLinks = response.data._links;

                            // collect the rest of the info
                            http.get(mSystemLinks.factionStatus.href).then(
                                function (response) {
                                    mFactionStatus = response.data._embedded.factionStatuses;
                                    ifInitalizedThenCb();
                                },
                                function (err) {
                                    console.log(err.data);
                                }
                            );

                            http.get(mSystemLinks.factionClass.href).then(
                                function (response) {
                                    mFactionClass = response.data._embedded.factionClasses;
                                    ifInitalizedThenCb();
                                },
                                function (err) {
                                    console.log(err.data);
                                }
                            );

                            http.get(mSystemLinks.userStatus.href).then(
                                function (response) {
                                    mUserStatus = response.data._embedded.userStatuses;
                                    ifInitalizedThenCb();
                                },
                                function (err) {
                                    console.log(err.data);
                                }
                            );

                            http.get(mSystemLinks.stars.href).then(
                                function (response) {
                                    mStar = response.data._embedded.stars;
                                    ifInitalizedThenCb();
                                },
                                function (err) {
                                    console.log(err.data);
                                }
                            );

                            http.get(mSystemLinks.terrainClass.href).then(
                                function (response) {
                                    mTerrainClass = response.data._embedded.terrainClasses;
                                    ifInitalizedThenCb();
                                },
                                function (err) {
                                    console.log(err.data);
                                }
                            );
                        },
                        function (err) {
                            console.log(err.data);
                        }
                    );
                },
                function (err) {
                    console.log(err.data);
                }
            );
        }
    };

    return NbtRoot;
})();

(function() {
    var nbt = new NBT();
    var app = angular.module('nbt.app');

    app.service('nbtRoot', ['$http', function($http) {
        return new _NbtRootService($http);
    }]);


    var ij = angular.injector(['ng', 'nbt.app']);
    var nbtRoot = ij.get('nbtRoot');

    nbt.init(nbtRoot);
})();
