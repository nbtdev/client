package com.netbattletech.client.collections;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.netbattletech.client.common.APIContext;
import com.netbattletech.client.common.AuthenticatedClient;
import com.netbattletech.client.common.EmbeddedCollectionResponse;
import com.netbattletech.client.common.HALResponse;
import com.netbattletech.client.model.League;
import com.netbattletech.client.model.Lobby;
import com.netbattletech.client.model.Match;
import com.netbattletech.client.security.Identity;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class Matches extends EmbeddedCollectionResponse<Match> {
    League league;
    Matches.Requestor requestor;

    private static class Requestor extends AuthenticatedClient {
        League league;
        public Requestor(League league, APIContext context, Identity identity) {
            super(context, identity);
            this.league = league;
        }

        public Match add(Lobby lobbyParams) throws Exception {
            HALResponse.Link matchesLink = league.getLink("matches");
            if (matchesLink == null) {
                return null;
            }

            HttpRequest req = createRequest(new URI(matchesLink.href), HttpMethod.POST, lobbyParams);
            HttpResponse resp = execute(req);
            Match match = resp.parseAs(Match.class);

            match.setContext(context, identity);

            return match;
        }

        public void remove(Match match) throws Exception {
            HALResponse.Link link = match.getLink("self");
            if (link == null) {
                return;
            }

            HttpRequest req = createRequest(new URI(link.href), HttpMethod.DELETE);
            req.execute();
        }
    }

    Requestor getRequestor() {
        if (requestor == null) {
            requestor = new Requestor(league, context, identity);
        }

        return requestor;
    }

    Map<String, ArrayList<Match>> getEmbedded() {
        if (_embedded == null) {
            _embedded = new HashMap<>();
            _embedded.put("matches", new ArrayList<>());
        }

        return _embedded;
    }

    public void setLeague(League league) {
        this.league = league;
    }

    public Match add(Lobby lobbyParams) throws Exception {
        Match match = getRequestor().add(lobbyParams);
        getEmbedded().values().iterator().next().add(match);
        return match;
    }

    public void remove(Match match) throws Exception {
        getRequestor().remove(match);
        getEmbedded().values().iterator().next().removeIf(l -> (l.id==match.id));
    }
}
