package com.netbattletech.client.model;

import com.google.api.client.util.Key;
import com.netbattletech.client.common.HALResponse;

import java.util.ArrayList;

public class Match extends HALResponse {
    @Key
    public Integer id;
    @Key
    public Integer leagueId;
    @Key
    public Integer lobbyId;
    @Key
    public Player owner;
    @Key
    public ArrayList<Player> players = new ArrayList<>();
    @Key
    public Integer upperLimit;
    @Key
    public Integer lowerLimit = 0;
}
