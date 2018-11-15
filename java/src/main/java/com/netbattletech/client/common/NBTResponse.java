package com.netbattletech.client.common;

import com.netbattletech.client.security.Identity;

public class NBTResponse {
    protected APIContext context;
    protected Identity identity;

    public void setContext(APIContext context) {
        this.context = context;
    }

    public void setContext(APIContext context, Identity identity) {
        this.context = context;
        this.identity = identity;
    }
}
