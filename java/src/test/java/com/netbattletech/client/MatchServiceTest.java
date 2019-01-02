package com.netbattletech.client;

import com.netbattletech.client.collections.Leagues;
import com.netbattletech.client.collections.Matches;
import com.netbattletech.client.common.API;
import com.netbattletech.client.model.League;
import com.netbattletech.client.model.Lobby;
import com.netbattletech.client.model.Match;
import org.junit.Test;

import java.net.URI;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

public class MatchServiceTest {
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
    public void TestMatchCreateAndDeleteFromLobby() throws Exception {
        API root = new API(new URI(TEST_APIURL), GUEST_USERNAME, GUEST_PASSWORD);
        Leagues leagues = root.getLeagues();
        League league = leagues.iterator().next();

        Lobby lobbyData = new Lobby();
        lobbyData.upperLimit = 8000;
        Lobby lobby = league.createLobby(lobbyData);

        Matches matches = league.fetchMatches();
        int matchCount = matches.size();

        Match match = matches.add(lobby);
        assertEquals(matchCount+1, (int)matches.size());

        assertEquals(lobby.id, match.lobbyId);
        assertEquals(lobby.leagueId, match.leagueId);
        assertEquals(lobby.lowerLimit, match.lowerLimit);
        assertEquals(lobby.upperLimit, match.upperLimit);

        league.removeMatch(match);
        matches = league.fetchMatches();
        assertEquals(matchCount, (int)matches.size());

        league.removeLobby(lobby);
    }

}
