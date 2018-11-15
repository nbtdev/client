package com.netbattletech.client.security;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.util.Key;
import com.netbattletech.client.common.NbtException;
import com.netbattletech.client.common.APIClient;
import com.netbattletech.client.common.APIContext;

import java.net.URI;

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
            throw new NbtException(e.getMessage());
        }
    }
}
