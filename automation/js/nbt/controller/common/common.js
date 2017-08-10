/**
 Copyright (c) 2017, Netbattletech
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

function setStatus($scope, message, success) {
    $scope.message = message;
    $scope.success = success;
}

function setStatusWithTimeout($scope, $timeout, message, success, delayMS) {
    setStatus($scope, message, success);

    if ($scope.$$timeoutPromise)
        $timeout.cancel($scope.$$timeoutPromise);

    // cause the message to go away in 'delay' millseconds
    $scope.$$timeoutPromise = $timeout(function() {
        $scope.message = null;
        delete $scope.$$timeoutPromise;
    }, delayMS);
}

function shallowCopy(dest, src) {
    // save off the current editable values; just shallow-copy the first level of property values
    Object.keys(src).forEach(function(k) {
        // skip anything that starts with $
        if (k.charAt(0)==='$')
            return;

        dest[k] = this[k];
    }, src);
}

function checkEnterKeyAndSubmit(event, scope, obj) {
    var code = event.which || event.keyCode;
    if (code === 13) {
        scope.onApply(obj);
    }
}