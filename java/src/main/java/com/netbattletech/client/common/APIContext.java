package com.netbattletech.client.common;

import com.google.api.client.http.*;
import com.netbattletech.client.security.CredentialRequestListener;

import java.io.IOException;
import java.net.URI;

public class APIContext extends APIClient {
    HALResponse apiRoot;
    CredentialRequestListener credentialRequestListener;

    public APIContext(URI rootUri) throws IOException {
        HttpResponse resp = createRequest(rootUri).execute();
        apiRoot = resp.parseAs(HALResponse.class);
    }

    public APIContext(URI rootUri, CredentialRequestListener credentialRequestListener) throws IOException {
        HttpResponse resp = createRequest(rootUri).execute();
        apiRoot = resp.parseAs(HALResponse.class);
        this.credentialRequestListener = credentialRequestListener;
    }

    public URI getLoginRoot() throws Exception {
        return getLink("login").getURI();
    }

    public URI getResetPasswordRoot() throws Exception {
        return getLink("resetPassword").getURI();
    }

    public URI getSignupRoot() throws Exception {
        return getLink("signup").getURI();
    }

    public URI getPrivacyRoot() throws Exception {
        return getLink("privacy").getURI();
    }

    public URI getLeaguesRoot() throws Exception {
        return getLink("leagues").getURI();
    }

    public URI getSystemRoot() throws Exception {
        return getLink("system").getURI();
    }

    private HALResponse.Link getLink(String rel) throws NbtException {
        if (apiRoot == null) {
            throw new NbtException("APIContext not initialized");
        }

        HALResponse.Link loginLink = apiRoot._links.get(rel);
        if (loginLink == null) {
            throw new NbtException(String.format("'%s' rel not found at API context root", rel));
        }
        return loginLink;
    }

    public CredentialRequestListener getCredentialRequestListener() {
        return credentialRequestListener;
    }
}
