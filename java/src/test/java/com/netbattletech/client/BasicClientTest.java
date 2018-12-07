package com.netbattletech.client;

import com.netbattletech.client.collections.Leagues;
import com.netbattletech.client.collections.Lobbies;
import com.netbattletech.client.common.API;
import com.netbattletech.client.common.APIContext;
import com.netbattletech.client.common.AuthenticatedClient;
import com.netbattletech.client.common.NbtException;
import com.netbattletech.client.model.League;
import com.netbattletech.client.model.Lobby;
import com.netbattletech.client.security.Authenticator;
import com.netbattletech.client.security.CredentialRequestListener;
import com.netbattletech.client.security.Identity;
import com.netbattletech.client.security.LoginCredentials;
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

        // make sure we can get all of the available leagues
        int leagueCount = leagues.size();
        for (int i=0; i<leagueCount; ++i) {
            League league = leagues.at(i);
            assertNotNull(league);
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
    public void TestGoodCredentialsCallback() throws Exception {
        API root = new API(new URI(TEST_APIURL), new CredentialRequestListener() {
            @Override
            public LoginCredentials loginCredentialRequest(Reason reason) {
                LoginCredentials credentials = new LoginCredentials();
                credentials.username = GUEST_USERNAME;
                credentials.password = GUEST_PASSWORD;
                return credentials;
            }
        });

        // do something we know will require a valid login
        Leagues leagues = root.getLeagues();

        Lobby lobby = new Lobby();
        lobby.upperLimit = 12000;
        lobby = leagues.at(0).getLobbies().add(lobby);
        assertNotNull(lobby);
    }

    @Test
    public void TestBadCredentialsCallback() throws Exception {
        class TestCredentialRequestListener implements CredentialRequestListener {
            public int count = 0;

            @Override
            public LoginCredentials loginCredentialRequest(Reason reason) {
                // only do this three times, then bail
                if (++count == 3) {
                    return null;
                }

                LoginCredentials credentials = new LoginCredentials();
                credentials.username = "blah";
                credentials.password = "foo";
                return credentials;
            }
        }
        TestCredentialRequestListener listener = new TestCredentialRequestListener();
        API root = new API(new URI(TEST_APIURL), listener);

        // do something we know will require a valid login
        Leagues leagues = root.getLeagues();

        Lobby lobby = new Lobby();
        lobby.upperLimit = 12000;
        Lobbies lobbies = leagues.at(0).getLobbies();

        try {
            lobbies.add(lobby);
        } catch (NbtException e) {
            e.printStackTrace();
        }

        assertEquals(3, listener.count);
    }

    @Test
    public void TestAddRemoveLeagueLobby() throws Exception {
        // authenticated API usage
        API root = new API(new URI(TEST_APIURL), GUEST_USERNAME, GUEST_PASSWORD);
        Leagues leagues = root.getLeagues();
        assertFalse(leagues.isEmpty());

        League league = leagues.iterator().next();
        long lobbyCount = league.fetchLobbies().size().longValue();

        Lobby lobbyData = new Lobby();
        lobbyData.upperLimit = 8000;
        Lobby lobby = league.createLobby(lobbyData);
        assertEquals(lobbyCount+1, league.fetchLobbies().size().longValue());

        // remove the lobby now
        league.removeLobby(lobby);
        assertEquals(lobbyCount, league.fetchLobbies().size().longValue());
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

        // clean up the lobby too
        league.removeLobby(lobby);
    }
}
