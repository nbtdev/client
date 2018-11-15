package com.netbattletech.client.common;

import com.google.api.client.util.Key;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;

public class HALResponse extends NBTResponse {
    public static class Link {
        @Key("href")
        public String href;

        public URI getURI() throws URISyntaxException {
            return new URI(href);
        }
    }

    @Key
    public HashMap<String, Link> _links;

    public Link getLink(String rel) {
        return _links.get(rel);
    }
}
