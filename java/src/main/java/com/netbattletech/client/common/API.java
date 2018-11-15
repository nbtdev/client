package com.netbattletech.client.common;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.netbattletech.client.collections.Leagues;
import com.netbattletech.client.model.League;
import com.netbattletech.client.security.Authenticator;
import com.netbattletech.client.security.Identity;

import java.io.IOException;
import java.net.URI;

public class API {
    APIContext context;
    Identity identity;
    Requestor requestor;

    Leagues leagues;

    public API(URI apiRootUri) throws IOException {
        context = new APIContext(apiRootUri);
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
            HttpResponse resp = req.execute();
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

    public boolean authenticate(String username, String password) {
        try {
            if (identity == null) {
                Authenticator authenticator = new Authenticator(context);
                identity = authenticator.login(username, password);
            }

            return true;
        } catch (NbtException e) {
            e.printStackTrace();
            return false;
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
