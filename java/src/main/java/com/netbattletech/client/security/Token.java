/*
 *  Copyright (c) 2015 NetBattleTech. All rights reserved.
 *
 *  Redistribution and/or reproduction, in whole or in part, without prior
 *  written permission of a duly authorized representative of NetBattleTech
 *  is prohibited.
 */
package com.netbattletech.client.security;

import com.google.api.client.util.Key;
import com.google.api.client.util.Value;

import java.util.Date;

/**
 * Token model object
 */
public class Token {

    @Key
    private String value;
    @Key
    private String username;
    @Key
    private Integer userId;
    private Date expires;

    // Google HTTP client doesn't seem to handle Date
    @Key("expires")
    private Long expiryTimestamp;

    private boolean isValid;
    @Key
    private CoarseRole coarseRole;

    public enum CoarseRole {
        @Value
        SITE_ADMIN,
        @Value
        LEAGUE_ADMIN,
        @Value
        TEAM_ADMIN,
        @Value
        GUEST
    }

    public Token() {
        value = null;
        username = null;
        userId = null;
        expires = null;
        expiryTimestamp = 0L;
        userId = null;
        this.coarseRole = CoarseRole.GUEST;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getUsername() {
        return username;
    }

    public void setUserId(Integer id) {
        this.userId = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Date getExpires() {
        if (expires == null) {
            expires = new Date(expiryTimestamp);
        }

        return expires;
    }

    public void setExpires(Date expires) {
        this.expires = expires;
    }

    public CoarseRole getCoarseRole() { return coarseRole; }

    public void setCoarseRole(CoarseRole aRole) { this.coarseRole = aRole; }

    public boolean isValid() {
        //TODO: implement expiration check
        return value != null;
    }
}
