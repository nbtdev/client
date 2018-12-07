package com.netbattletech.client.model;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.util.Key;
import com.netbattletech.client.common.APIContext;
import com.netbattletech.client.common.AuthenticatedClient;
import com.netbattletech.client.common.HALResponse;
import com.netbattletech.client.common.NbtException;
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

    @Override
    public String toString() {
        return owner.callsign;
    }

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

            HttpRequest req = createRequest(new URI(players.href), HttpMethod.POST, new Player());
            HttpResponse resp = execute(req);
            lobby = resp.parseAs(Lobby.class);
            lobby.setContext(context, identity);
            return lobby;
        }

        public Lobby leave(Lobby lobby, Player player) throws Exception {
            if (lobby == null || player == null) {
                throw new NullPointerException("Lobby and player must be non-null");
            }

            Link link = null;

            for (Player p : lobby.players) {
                if (p.userId.equals(player.userId)) {
                    link = p._links.get("lobbySelf");
                }
            }

            if (link == null) {
                // try the lobby owner
                if (player.userId.equals(lobby.owner.userId)) {
                    link = lobby.owner._links.get("lobbySelf");
                }
            }

            // if still not found, then the player isn't in this lobby at all, except
            if (link == null) {
                throw new NbtException(String.format("Player '%s' not found in this lobby", player.callsign));
            }

            // else, remove the player from the lobby
            HttpRequest req = createRequest(new URI(link.href), HttpMethod.DELETE);
            HttpResponse resp = execute(req);

            try {
                lobby = resp.parseAs(Lobby.class);
                lobby.setContext(context, identity);
            } catch (IllegalArgumentException e) {
                // the return value is empty if the lobby was removed, return null in this case
                lobby = null;
            }

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
        Integer userId = identity.userId();

        Player player = players.stream()
                .filter(pl -> (pl.userId.equals(userId)))
                .findAny()
                .orElse(null);

        if (player == null) {
            if (userId.equals(owner.userId)) {
                player = owner;
            }
        }

        return getRequestor().leave(this, player);
    }
}
