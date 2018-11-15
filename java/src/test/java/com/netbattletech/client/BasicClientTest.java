package com.netbattletech.client;

import com.netbattletech.client.collections.Leagues;
import com.netbattletech.client.collections.Lobbies;
import com.netbattletech.client.common.API;
import com.netbattletech.client.common.APIContext;
import com.netbattletech.client.common.AuthenticatedClient;
import com.netbattletech.client.model.League;
import com.netbattletech.client.model.Lobby;
import com.netbattletech.client.security.Authenticator;
import com.netbattletech.client.security.Identity;
import org.junit.Test;
import java.net.URI;

import static org.junit.Assert.*;

public class BasicClientTest {
    static final String TEST_APIURL = "http://api-home.netbattletech.com:8080";
    static final String TEST_USERNAME = "testuser";
    static final String TEST_PASSWORD = "testuser";
    static final Integer TEST_USERID = 1;
    static final String GUEST_USERNAME = "guest";
    static final String GUEST_PASSWORD = "2eX7XNkF";
    static final Integer GUEST_USERID = 8;
    static final String UNIT_MEMBER_USERNAME = "member";
    static final String UNIT_MEMBER_PASSWORD = "ANGtr5at";
    static final Integer UNIT_MEMBER_USERID = 7;

    @Test
    public void TestRootURLs() throws Exception {
        APIContext context = new APIContext(new URI(TEST_APIURL));

        assertNotNull(context.getLoginRoot());
        assertNotNull(context.getResetPasswordRoot());
        assertNotNull(context.getPrivacyRoot());
        assertNotNull(context.getSignupRoot());
        assertNotNull(context.getLeaguesRoot());
        assertNotNull(context.getSystemRoot());
    }

    @Test
    public void TestLogin() throws Exception {
        // anonymous API usage
        APIContext context = new APIContext(new URI(TEST_APIURL));
        Authenticator authenticator = new Authenticator(context);
        Identity ident = authenticator.login(TEST_USERNAME, TEST_PASSWORD);

        assertNotNull(ident);
        assertEquals(TEST_USERNAME, ident.name());
        assertEquals(TEST_USERID, ident.userId());
    }

    @Test
    public void TestLeagueListing() throws Exception {
        // anonymous API usage
        API root = new API(new URI(TEST_APIURL));
        Leagues leagues = root.getLeagues();

        for (League league : leagues) {
            System.out.println(league.abbreviation);
        }
    }

    @Test
    public void TestListLeagueLobbies() throws Exception {
        // anonymous API usage
        API root = new API(new URI(TEST_APIURL));
        Leagues leagues = root.getLeagues();

        for (League league : leagues) {
            Lobbies lobbies = league.fetchLobbies();
            for (Lobby lobby : lobbies) {
                System.out.println(lobby.id);
            }
        }
    }

    @Test
    public void TestAuthenticatedClient() throws Exception {
        API root = new API(new URI(TEST_APIURL), GUEST_USERNAME, GUEST_PASSWORD);
    }

    @Test
    public void TestAddRemoveLeagueLobby() throws Exception {
        // authenticated API usage
        API root = new API(new URI(TEST_APIURL), GUEST_USERNAME, GUEST_PASSWORD);
        Leagues leagues = root.getLeagues();
        assertFalse(leagues.isEmpty());

        League league = leagues.iterator().next();
        long lobbyCount = league.getLobbies().size().longValue();

        Lobby lobbyData = new Lobby();
        lobbyData.upperLimit = 8000;
        Lobby lobby = league.createLobby(lobbyData);
        assertEquals(lobbyCount+1, league.getLobbies().size().longValue());

        // remove the lobby now
        league.removeLobby(lobby);
        assertEquals(lobbyCount, league.getLobbies().size().longValue());
    }

    @Test
    public void TestJoinLeaveLobbyPlayer() throws Exception {
        // this is us
        API root = new API(new URI(TEST_APIURL), GUEST_USERNAME, GUEST_PASSWORD);
        Leagues leagues = root.getLeagues();
        League league = leagues.iterator().next();

        Lobby lobbyParams = new Lobby();
        lobbyParams.upperLimit = 7500;
        Lobby lobby = league.createLobby(lobbyParams);

        // this is them
        API memberRoot = new API(new URI(TEST_APIURL), UNIT_MEMBER_USERNAME, UNIT_MEMBER_PASSWORD);
        Leagues memberLeagues = memberRoot.getLeagues();
        League memberLeague = memberLeagues.iterator().next();

        // find the lobby they want to join
        Lobbies memberLobbies = memberLeague.getLobbies();
        Lobby newLobbyState = null;
        for (Lobby memberLobby : memberLobbies) {
            if (memberLobby.id == lobby.id) {
                // and join it
                newLobbyState = memberLobby.join();
                break;
            }
        }

        assertNotNull(newLobbyState);
        assertEquals(lobby.players.size()+1, newLobbyState.players.size());

        // then leave the lobby we just joined
        newLobbyState = newLobbyState.leave();
        assertNotNull(newLobbyState);
        assertEquals(lobby.players.size(), newLobbyState.players.size());
    }
}
