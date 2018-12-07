package com.netbattletech.client.common;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.netbattletech.client.collections.Leagues;
import com.netbattletech.client.model.League;
import com.netbattletech.client.security.Authenticator;
import com.netbattletech.client.security.CredentialRequestListener;
import com.netbattletech.client.security.Identity;
import java.net.URI;

public class API {
    APIContext context;
    Identity identity;
    Requestor requestor;

    Leagues leagues;

    public API(URI apiRootUri) throws Exception {
        this(apiRootUri, null);
    }

    public API(URI apiRootUri, CredentialRequestListener credentialRequestListener) throws Exception {
        context = new APIContext(apiRootUri, credentialRequestListener);
    }

    public API(URI apiRootUri, String username, String password) throws Exception {
        context = new APIContext(apiRootUri);
        authenticate(username, password);
    }

    private static class Requestor extends AuthenticatedClient {
        public Requestor(APIContext context, Identity identity) {
            super(context, identity);
        }

        Leagues getLeagues() throws Exception {
            HttpRequest req = createRequest(context.getLeaguesRoot());
            HttpResponse resp = execute(req);
            Leagues leagues = resp.parseAs(Leagues.class);
            leagues.setContext(context, identity);

            // and for each in the collection
            for (League l : leagues) {
                l.setContext(context, identity);
            }
            return leagues;
        }
    }

    Requestor getRequestor() {
        if (requestor == null) {
            requestor = new Requestor(context, identity);
        }

        return requestor;
    }

    public void authenticate(String username, String password) throws NbtException {
        if (identity == null) {
            Authenticator authenticator = new Authenticator(context);
            identity = authenticator.login(username, password);
        }
    }

    public Leagues getLeagues() throws Exception {
        return getLeagues(false);
    }

    public Leagues getLeagues(boolean forceReload) throws Exception {
        if (leagues == null || forceReload) {
            leagues = getRequestor().getLeagues();
        }

        return leagues;
    }
}
