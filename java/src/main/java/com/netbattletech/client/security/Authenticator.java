package com.netbattletech.client.security;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.util.Key;
import com.netbattletech.client.common.NbtException;
import com.netbattletech.client.common.APIClient;
import com.netbattletech.client.common.APIContext;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

public class Authenticator extends APIClient {
    APIContext context;

    public static class Login {
        private Login(String username, String password) {
            this.username = username;
            this.password = password;
        }

        @Key
        public String username;

        @Key
        public String password;
    }

    public Authenticator(APIContext context) {
        this.context = context;
    }

    public Identity login(String username, String password) throws NbtException {
        try {
            // first, get the URI for the login endpoint
            URI loginUri = context.getLoginRoot();

            // then, send a Login object to the endpoint
            Login login = new Login(username, password);
            HttpRequest req = createRequest(loginUri, HttpMethod.POST, login);

            // response should contain a Token
            Token token = req.execute().parseAs(Token.class);
            UserIdentity ident = new UserIdentity(token);
            return ident;
        } catch (Exception e) {
            e.printStackTrace();
            throw new NbtException("Username or password incorrect");
        }
    }

    public void logout(Identity identity) throws NbtException {
        if (!(identity instanceof UserIdentity)) {
            throw new NbtException("Unknown implementation of Identity");
        }

        try {
            UserIdentity userIdentity = (UserIdentity)identity;
            HttpRequest req = createRequest(new URI(userIdentity._links.get("logout").href), HttpMethod.DELETE);
            req.execute();
        } catch (IOException e) {
            e.printStackTrace();
            throw new NbtException(e.getMessage());
        } catch (URISyntaxException e) {
            e.printStackTrace();
            throw new NbtException(e.getMessage());
        }
    }
}
