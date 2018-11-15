package com.netbattletech.client.common;

import com.netbattletech.client.security.Authenticator;
import com.netbattletech.client.security.Identity;

import java.io.IOException;
import java.net.URI;

public class AuthenticatedClient extends APIClient {
    protected Identity identity;
    protected APIContext context;

    public AuthenticatedClient(APIContext context, Identity identity) {
        this.context = context;
        this.identity = identity;
    }

    public AuthenticatedClient(URI apiURI, Identity identity) throws NbtException {
        try {
            context = new APIContext(apiURI);
            this.identity = identity;
        } catch (IOException e) {
            e.printStackTrace();
            throw new NbtException(e.getMessage());
        }
    }

    public AuthenticatedClient(URI apiURI, String username, String password) throws NbtException {
        try {
            context = new APIContext(apiURI);
            Authenticator authenticator = new Authenticator(context);
            identity = authenticator.login(username, password);
        } catch (IOException e) {
            e.printStackTrace();
            throw new NbtException(e.getMessage());
        }
    }

    @Override
    protected String getToken() {
        if (identity != null) {
            return identity.token();
        }

        return null;
    }
}
