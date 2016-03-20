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
    var app = angular.module('nbt.app');

    // controller for user-account-management template
    app.controller('ControllerUserAccounts', ['$scope', 'nbtIdentity', 'nbtUser', 'nbtRoot', function($scope, nbtIdentity, nbtUser, nbtRoot) {
        var self = this;
        var mEditingUsers = [];
        var mNewUser = null;

        function save(aUser) {
            aUser._orig = {
                id: aUser.id,
                login: aUser.login,
                status: aUser.status
            };
        }

        function restore(aUser) {
            if (aUser._orig) {
                aUser.id = aUser._orig.id;
                aUser.login = aUser._orig.login;
                aUser.status = aUser._orig.status;
                aUser._orig = null;
            }
        }

        function updateEditingUsers(aNewUserList) {
            // update the editing-users list (the object instances
            // will have changed)
            var newList = [];
            for (var i=0; i<aNewUserList.length; ++i) {
                if (mEditingUsers.findIndex(function(elem, idx, arr) {
                        return aNewUserList[i].id === elem.id;
                    }) >= 0)
                {
                    newList.push(aNewUserList[i]);
                }
            }

            mEditingUsers = newList;
        }

        this.reload = function() {
            $scope.busy = true;
            nbtUser.fetchUsers({}, nbtIdentity.get().token,
                function(aResp) {
                    $scope.users = aResp;
                },
                null,
                function() {
                    $scope.busy = false;
                }
            );
        };

        this.showAddNewUser = function() {
            var token = nbtIdentity.get();

            return (token.isSiteAdmin());
        };

        this.showNewUserForm = function() {
            var token = nbtIdentity.get();

            return (token.isSiteAdmin() && mNewUser);
        }

        this.showEditIcon = function(aUser) {
            var token = nbtIdentity.get();

            return (token.isSiteAdmin() && !this.isEditing(aUser));
        };

        this.showDeleteIcon = function(aUser) {
            var token = nbtIdentity.get();

            return (token.isSiteAdmin() && !this.isEditing(aUser));
        };

        this.showApplyIcon = function(aUser) {
            var token = nbtIdentity.get();

            return (token.isSiteAdmin() && this.isEditing(aUser));
        };

        this.showCancelIcon = function(aUser) {
            var token = nbtIdentity.get();

            return (token.isSiteAdmin() && this.isEditing(aUser));
        };

        this.isEditing = function(aUser) {
            var idx = mEditingUsers.indexOf(aUser);
            return idx >= 0;
        };

        this.beginAdd = function() {
            mNewUser = {};
        };

        this.applyAdd = function() {
            mNewUser = $scope.newUser;
            $scope.busy = true;

            var token = nbtIdentity.get();

            var path = window.location.pathname.replace('index.html', '');

            mNewUser.activationUrl = window.location.origin + path + 'activate.html';
            mNewUser.privacyUrl = window.location.origin + path + "privacy.html";

            nbtUser.add(mNewUser, token.token,
                function(aData) {
                    $scope.users = aData;
                    updateEditingUsers(aData);
                    self.cancelAdd();
                },
                function(aErr) {
                    $scope.errorMessage = aErr;
                },
                function() {
                    $scope.busy = false;
                }
            );
        };

        this.cancelAdd = function() {
            mNewUser = null;
            $scope.newUser = {};
            $scope.errorMessage = null;
        };

        this.beginEdit = function(aUser) {
            save(aUser);
            mEditingUsers.push(aUser);
        };

        this.closeEdit = function(aUser) {
            var idx = mEditingUsers.indexOf(aUser);

            if (idx >= 0) {
                mEditingUsers.splice(idx, 1);
            }
        };

        this.cancelEdit = function(aUser) {
            self.closeEdit(aUser);
            restore(aUser);
        };

        this.applyEdit = function(aUser) {
            if (aUser) {
                var token = nbtIdentity.get();

                nbtUser.update(aUser, token.token,
                    // success callback
                    function() {
                        // close the edit mode
                        self.closeEdit(aUser);
                    },
                    // failure callback
                    function(err) {
                        restore(aUser);
                        alert("Failed to update user account '" + aUser.login + "': " + err);
                    }
                );
            }
        };

        this.delete = function(aUser) {
            if (aUser) {
                if (confirm("Are you sure you wish to delete user '" + aUser.login + "'?")) {
                    var token = nbtIdentity.get();
                    $scope.busy = true;

                    nbtUser.delete(aUser, token.token,
                        // success callback
                        function(userList) {
                            // refresh the $scope users collection
                            $scope.users = userList;

                            updateEditingUsers(userList);
                        },
                        // failure callback
                        function(err) {
                            alert("Failed to delete user '" + aUser.login + "': " + err);
                        },
                        function() {
                            $scope.busy = false;
                        }
                    );
                }
            }
        };

        $scope.userStatuses = nbtRoot.userStatus();
        $scope.newUser = {};
        $scope.errorMessage = null;

        this.reload();
    }]);
})();