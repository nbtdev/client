package com.netbattletech.client.common;

import com.netbattletech.client.security.Authenticator;
import com.netbattletech.client.security.CredentialRequestListener;
import com.netbattletech.client.security.Identity;
import com.netbattletech.client.security.LoginCredentials;

import java.io.IOException;
import java.net.URI;

public class AuthenticatedClient extends APIClient {
    protected APIContext context;
    protected Identity identity;

    public AuthenticatedClient(APIContext context) {
        this.context = context;
    }

    public AuthenticatedClient(APIContext context, Identity identity) {
        this.context = context;
        this.identity = identity;
    }

    public AuthenticatedClient(URI apiURI) throws NbtException {
        try {
            context = new APIContext(apiURI);
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

    @Override
    protected boolean authenticate(AuthenticationReason reason) throws NbtException {
        CredentialRequestListener listener = context.getCredentialRequestListener();
        if (listener == null) {
            return false;
        }

        // call out for credentials so we can login
        CredentialRequestListener.Reason authReason =  CredentialRequestListener.Reason.UNKNOWN;
        switch (reason) {
            case MISSING_IDENTITY:
                authReason = CredentialRequestListener.Reason.MISSING_IDENTITY;
                break;
            case CREDENTIALS_INVALID:
                authReason = CredentialRequestListener.Reason.CREDENTIALS_INVALID;
                break;
        }

        LoginCredentials credentials = listener.loginCredentialRequest(authReason);
        if (credentials == null) {
            return false;
        }

        Authenticator authenticator = new Authenticator(context);
        try {
            identity = authenticator.login(credentials.username, credentials.password);
        } catch (NbtException e) {
            System.out.println(e.getMessage());
        }

        return true;
    }
}
