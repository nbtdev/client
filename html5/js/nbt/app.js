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
function NBT() {
    var self = this;
    var app = angular.module('nbt.app', ['nbt.starmap', 'nbt.profile', 'nbt.starmapDetail']);

    // root API url
    var API_URL = 'http://api.home.lan';
    //var API_URL = 'http://localhost:8080';
    //var API_URL = 'http://api-dev.netbattletech.com';

    var mRootLinks = null;

    // allow external code to do something after bootstrap
    this.onbootstrap = null;

    app.service('nbtRoot', [function() {
        this.links = function() {
            return self.mRootLinks;
        };
    }]);

    // thanks for this bootstrap code goes out to https://blog.mariusschulz.com/2014/10/22/asynchronously-bootstrapping-angularjs-applications-with-server-side-data
    this.init = function() {
        self.mInitializing = true;

        fetchRootLinks().then(doBootstrap);

        function fetchRootLinks() {
            // get a handle to the Angular $http object
            var initInjector = angular.injector(['ng']);
            var $http = initInjector.get('$http');

            // call to the API to get the root links
            return $http.get(API_URL).then(
                function (response) {
                    self.mRootLinks = response.data._links;
                },
                function (err) {
                    console.log(err.data);
                }
            );
        }

        function doBootstrap() {
            angular.element(document).ready(function () {
                angular.bootstrap(document, ['nbt.app']);
                self.mInitializing = false;

                if (self.onbootstrap) self.onbootstrap();
            });
        }
    };
}


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

var nbt = new NBT();
nbt.init();
