package com.netbattletech.client.collections;

import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpResponse;
import com.netbattletech.client.common.APIContext;
import com.netbattletech.client.common.AuthenticatedClient;
import com.netbattletech.client.common.EmbeddedCollectionResponse;
import com.netbattletech.client.model.League;
import com.netbattletech.client.security.Identity;

public class Leagues extends EmbeddedCollectionResponse<League> {

    private static class Requestor extends AuthenticatedClient {
        APIContext context;
        public Requestor(APIContext context, Identity identity) {
            super(context, identity);
        }
    }
}
