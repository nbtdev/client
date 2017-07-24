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
    var injector = angular.injector(['ng', 'nbt.app']);
    var registry = injector.get('nbtTools');

    if (registry) {
        var tool = {};

        tool.global = {
            name: 'settings',
            icon: 'img/icon/gear.png',
            loginRequired: true
        };

        tool[UserRole.SITE_ADMIN] = {
            tooltip: 'Site Control Panel',
            template: 'tools/site_admin_settings.html'
        };

        tool[UserRole.DEVELOPER] = tool[UserRole.SITE_ADMIN];

        tool[UserRole.PRECENTOR] = {
            tooltip: 'League Control Panel',
            template: 'tools/league_admin_settings.html'
        };

        tool[UserRole.DEMI_PRECENTOR] = tool[UserRole.PRECENTOR];

        tool[UserRole.TEAM_LEADER] = {
            tooltip: 'Faction Control Panel',
            template: 'tools/faction_admin_settings.html'
        };

        tool[UserRole.TEAM_MEMBER] = {
            tooltip: 'Automation Settings',
            template: 'tools/user_settings.html'
        };

        tool[UserRole.GUEST] = tool[UserRole.TEAM_MEMBER];

        registry.register(tool);
    }
})();