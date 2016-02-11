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
    var app = angular.module('nbt.app', ['nbt.starmap', 'nbt.profile']);

    // root API url
    var API_URL = 'http://api.home.lan';
    //var API_URL = 'http://api-dev.netbattletech.com';

    var mRootLinks = null;
    var mToken = null;
    var mLeagueUrl = null;
    var mInitializing = false;

    // controller references
    var profileController = null;

    this.rootLinks = function() {
        return self.mRootLinks;
    }

    this.addRootLink = function(aName, aLink) {
        self.mRootLinks[aName] = aLink;
    }

    // allow external code to do something after bootstrap
    this.onbootstrap = null;

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

    function reloadStarmap(aUrl, aToken) {
        // HACKY!!!! don't do this...
        var starmap = document.getElementById('starmap');

        starmap.reload(aUrl, aToken);
    }

    function reloadComponents() {
        // 1. reload starmap

        var leagueLinks = null;

        // get a handle to the Angular $http object
        var initInjector = angular.injector(['ng']);
        var $http = initInjector.get('$http');

        // call to the API to get the links for this league
        if (self.mLeagueUrl && self.mLeagueUrl !== null) {
            return $http.get(self.mLeagueUrl).then(
                function (response) {
                    leagueLinks = response.data._links;

                    // reload the starmap
                    reloadStarmap(leagueLinks.planets.href, self.mToken);
                },
                function (err) {
                    console.log(err.data);
                }
            );
        }
    }

    this.onLoginChanged = function(aToken) {
        if (self.mToken === aToken)
            return;

        self.mToken = aToken;

        if (self.mInitializing === false)
            reloadComponents();
    }

    this.onLeagueChanged = function(aNewLeagueUrl) {
        if (self.mLeagueUrl === aNewLeagueUrl)
            return;

        self.mLeagueUrl = aNewLeagueUrl;

        if (self.mInitializing === false)
            reloadComponents();
    };
}

var nbt = new NBT();
nbt.init();
