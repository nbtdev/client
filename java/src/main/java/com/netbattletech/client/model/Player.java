package com.netbattletech.client.model;

import com.google.api.client.util.Key;
import com.netbattletech.client.common.HALResponse;

public class Player extends HALResponse {
    @Key
    public String callsign;
    @Key
    public Integer userId;

    @Override
    public String toString() {
        return callsign;
    }
}
