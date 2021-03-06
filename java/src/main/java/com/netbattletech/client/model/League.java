package com.netbattletech.client.model;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.util.Key;
import com.netbattletech.client.collections.Lobbies;
import com.netbattletech.client.collections.Matches;
import com.netbattletech.client.common.APIContext;
import com.netbattletech.client.common.AuthenticatedClient;
import com.netbattletech.client.common.HALResponse;
import com.netbattletech.client.security.Identity;

public class League extends HALResponse {
    public static class Status {
        @Key
        public Integer id;
        @Key
        public String shortName;
        @Key
        public String displayName;
    }

    @Key
    public Integer id;
    @Key
    public String leagueId;
    @Key
    public String name;
    @Key
    public String abbreviation;

    // TODO: this should be changed to accept a Status object (once the API starts sending those...)
    @Key
    public String leagueStatus;

    // non-serializable members
    Lobbies lobbies;
    Matches matches;
    Requestor requestor;

    public League() {
    }

    @Override
    public String toString() {
        return name;
    }

    private static class Requestor extends AuthenticatedClient {
        League league;

        public Requestor(APIContext context, Identity identity, League league) {
            super(context, identity);
            this.league = league;
        }

        Lobbies fetchLobbies() throws Exception {
            Link link = league.getLink("lobbies");
            if (link == null) {
                return new Lobbies();
            }

            HttpRequest req = createRequest(link.getURI());
            HttpResponse resp = execute(req);
            Lobbies lobbies = resp.parseAs(Lobbies.class);
            lobbies.setContext(context, identity);
            lobbies.setLeague(league);

            // and for each in the collection
            for (Lobby l : lobbies) {
                l.setContext(context, identity);
            }

            return lobbies;
        }

        Matches fetchMatches() throws Exception {
            Link link = league.getLink("matches");
            if (link == null) {
                return new Matches();
            }

            HttpRequest req = createRequest(link.getURI());
            HttpResponse resp = execute(req);
            Matches matches = resp.parseAs(Matches.class);
            matches.setContext(context, identity);
            matches.setLeague(league);

            // and for each in the collection
            for (Match m : matches) {
                m.setContext(context, identity);
            }

            return matches;
        }
    }

    Requestor getRequestor() {
        if (requestor == null) {
            requestor = new Requestor(context, identity, this);
        }

        return requestor;
    }

    public Lobbies fetchLobbies() throws Exception {
        return getRequestor().fetchLobbies();
    }

    public Lobbies getLobbies() throws Exception {
        if (lobbies == null) {
            lobbies = fetchLobbies();
        }

        return lobbies;
    }

    public Matches fetchMatches() throws Exception {
        return getRequestor().fetchMatches();
    }

    public Matches getMatches() throws Exception {
        if (matches == null) {
            matches = fetchMatches();
        }

        return matches;
    }

    public Lobby createLobby(Lobby lobby) throws Exception {
        return getLobbies().add(lobby);
    }

    public void removeLobby(Lobby lobby) throws Exception {
        getLobbies().remove(lobby);
    }

    public Match createMatch(Lobby lobby) throws Exception {
        return getMatches().add(lobby);
    }

    public void removeMatch(Match match) throws Exception {
        getMatches().remove(match);
    }
}
