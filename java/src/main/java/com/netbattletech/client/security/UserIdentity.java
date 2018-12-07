package com.netbattletech.client.security;

import com.netbattletech.client.common.HALResponse;

public class UserIdentity extends HALResponse implements Identity {
    Token token;

    protected UserIdentity(Token token) {
        this.token = token;
    }

    @Override
    public String name() {
        if (token == null) {
            return null;
        }

        return token.getUsername();
    }

    @Override
    public Integer userId() {
        if (token == null) {
            return null;
        }

        return token.getUserId();
    }

    @Override
    public String token() {
        if (token == null) {
            return null;
        }

        return token.getValue();
    }
}
