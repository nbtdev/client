package com.netbattletech.client.security;

public class UserIdentity implements Identity {
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
