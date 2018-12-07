package com.netbattletech.client.collections;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.netbattletech.client.common.*;
import com.netbattletech.client.model.League;
import com.netbattletech.client.model.Lobby;
import com.netbattletech.client.security.Identity;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class Lobbies extends EmbeddedCollectionResponse<Lobby>  {
    League league;
    Requestor requestor;

    private static class Requestor extends AuthenticatedClient {
        League league;
        public Requestor(League league, APIContext context, Identity identity) {
            super(context, identity);
            this.league = league;
        }

        public Lobby add(Lobby lobbyParams) throws Exception {
            HALResponse.Link lobbiesLink = league.getLink("lobbies");
            if (lobbiesLink == null) {
                return null;
            }

            HttpRequest req = createRequest(new URI(lobbiesLink.href), HttpMethod.POST, lobbyParams);
            HttpResponse resp = execute(req);
            Lobby lobby = resp.parseAs(Lobby.class);

            lobby.setContext(context, identity);

            return lobby;
        }

        public void remove(Lobby lobby) throws Exception {
            HALResponse.Link link = lobby.getLink("self");
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

    Map<String, ArrayList<Lobby>> getEmbedded() {
        if (_embedded == null) {
            _embedded = new HashMap<>();
            _embedded.put("lobbies", new ArrayList<>());
        }

        return _embedded;
    }

    public void setLeague(League league) {
        this.league = league;
    }

    public Lobby add(Lobby lobbyParams) throws Exception {
        Lobby lobby = getRequestor().add(lobbyParams);
        getEmbedded().values().iterator().next().add(lobby);
        return lobby;
    }

    public void remove(Lobby lobby) throws Exception {
        getRequestor().remove(lobby);
        getEmbedded().values().iterator().next().removeIf(l -> (l.id==lobby.id));
    }
}
