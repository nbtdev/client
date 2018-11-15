package com.netbattletech.client.common;

import com.google.api.client.http.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.http.json.JsonHttpContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.JsonObjectParser;
import com.google.api.client.json.jackson2.JacksonFactory;

import java.io.IOException;
import java.net.URI;

public class APIClient {
    static final String NBT_TOKEN_HEADER = "X-NBT-Token";
    static final HttpTransport HTTP_TRANSPORT = new NetHttpTransport();
    static final JsonFactory JSON_FACTORY = new JacksonFactory();

    public enum HttpMethod {
        GET,
        POST,
        PUT,
        DELETE,
        HEAD,
        OPTIONS,
        PATCH,
        TRACE,
    }

    HttpRequestFactory REQUEST_FACTORY = HTTP_TRANSPORT.createRequestFactory(new HttpRequestInitializer() {
        @Override
        public void initialize(HttpRequest request) throws IOException {
            request.setParser(new JsonObjectParser(JSON_FACTORY));
        }
    });

    protected HttpRequest createRequest(URI uri) throws IOException {
        return createRequest(uri, HttpMethod.GET);
    }

    protected HttpRequest createRequest(URI uri, HttpMethod method) throws IOException {
        return createRequest(uri, method, (HttpContent)null);
    }

    protected HttpRequest createRequest(URI uri, HttpMethod method, String content) throws IOException {
        HttpContent stringContent = ByteArrayContent.fromString(null, content);
        return createRequest(uri, method, stringContent);
    }

    protected HttpRequest createRequest(URI uri, HttpMethod method, Object content) throws IOException {
        HttpContent jsonContent = new JsonHttpContent(JSON_FACTORY, content);
        return createRequest(uri, method, jsonContent);
    }

    protected HttpRequest createRequest(URI uri, HttpMethod method, HttpContent content) throws IOException {
        HttpRequest request = null;

        switch (method) {
            case GET:
                request = REQUEST_FACTORY.buildGetRequest(new GenericUrl(uri));
                break;
            case PUT:
                request = REQUEST_FACTORY.buildPutRequest(new GenericUrl(uri), content);
                break;
            case POST:
                request = REQUEST_FACTORY.buildPostRequest(new GenericUrl(uri), content);
                break;
            case DELETE:
                request = REQUEST_FACTORY.buildDeleteRequest(new GenericUrl(uri));
                break;
        }

        String token = getToken();
        if (token != null) {
            // then add our token to the headers
            request.getHeaders().set(NBT_TOKEN_HEADER, token);
        }

        return request;
    }

    protected String getToken() {
        return null;
    }
}
