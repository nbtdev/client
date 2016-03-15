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

var _ToolRegistry = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var mTools = {};

    function ToolRegistry(aHttp, aRootScope) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
    }

    // register a tool for use in tools menu
    ToolRegistry.prototype.register = function (aTool) {
        mTools[aTool.global.name] = aTool;
    };

    ToolRegistry.prototype.getTools = function(aRole) {
        var rtn = {};

        Object.keys(mTools).forEach(function(aKey) {
            var entry = mTools[aKey];

            if (entry[aRole]) {
                // copy the role-specific tool definition
                rtn[aKey] = entry[aRole];

                // copy all tool-level properties too
                Object.keys(entry.global).forEach(function(aKey2) {
                    rtn[aKey][aKey2] = entry.global[aKey2];
                });
            }
        });

        return rtn;
    };

    return ToolRegistry;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtTools', ['$http', '$rootScope', function($http, $rootScope) {
        return new _ToolRegistry($http, $rootScope);
    }]);
})();