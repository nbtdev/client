package com.netbattletech.client.model;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.util.Key;
import com.netbattletech.client.common.APIContext;
import com.netbattletech.client.common.AuthenticatedClient;
import com.netbattletech.client.common.HALResponse;
import com.netbattletech.client.security.Identity;

import java.net.URI;
import java.util.ArrayList;

public class Lobby extends HALResponse {
    @Key
    public Integer id;
    @Key
    public Integer leagueId;
    @Key
    public Player owner;
    @Key
    public ArrayList<Player> players = new ArrayList<>();
    @Key
    public Integer upperLimit;
    @Key
    public Integer lowerLimit = 0;

    // non-serializable members
    Requestor requestor;

    private static class Requestor extends AuthenticatedClient {
        public Requestor(APIContext context, Identity identity) {
            super(context, identity);
        }

        public Lobby join(Lobby lobby) throws Exception {
            if (lobby == null) {
                return null;
            }

            Link players = lobby._links.get("players");
            if (players == null) {
                return null;
            }

            HttpResponse resp = createRequest(new URI(players.href), HttpMethod.POST, new Player()).execute();
            lobby = resp.parseAs(Lobby.class);
            lobby.setContext(context, identity);
            return lobby;
        }

        public Lobby leave(Lobby lobby, Player player) throws Exception {
            if (lobby == null || player == null) {
                return null;
            }

            Link link = null;

            for (Player p : lobby.players) {
                if (p.userId == player.userId) {
                    link = p._links.get("lobbySelf");
                }
            }

            if (link == null) {
                // player not found
                return null;
            }

            // also remove from the "live" object
            lobby.players.removeIf(pl -> (pl.userId==player.userId));

            // else, remove the player from the lobby
            HttpRequest req = createRequest(new URI(link.href), HttpMethod.DELETE);
            HttpResponse resp = req.execute();
            lobby = resp.parseAs(Lobby.class);
            lobby.setContext(context, identity);
            return lobby;
        }
    }

    Requestor getRequestor() {
        if (requestor == null) {
            requestor = new Requestor(context, identity);
        }

        return requestor;
    }

    public Lobby join() throws Exception {
        return getRequestor().join(this);
    }

    public Lobby leave() throws Exception {
        Player player = players.stream()
                .filter(pl -> (pl.userId==identity.userId()))
                .findAny()
                .orElse(null);

        return getRequestor().leave(this, player);
    }
}
