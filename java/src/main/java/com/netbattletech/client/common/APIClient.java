package com.netbattletech.client.common;

import com.google.api.client.http.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.http.json.JsonHttpContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.JsonObjectParser;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.netbattletech.client.security.LoginCredentials;

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

    protected enum AuthenticationReason {
        MISSING_IDENTITY,
        CREDENTIALS_INVALID,
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

    protected HttpResponse execute(HttpRequest request) throws IOException, NbtException {
        HttpResponse resp = null;

        try {
            resp = request.execute();
        } catch (HttpResponseException e) {
            // 401 means "you can try logging in first"; 403 means "you're already logged
            // in, but you don't have access level to do what you tried to do", so we only handle
            // 401 (Unauthorized)
            if (e.getStatusCode() != 401) {
                throw new NbtException(e.getStatusMessage());
            }
        }

        // if the response object is not null, just return it now; otherwise, we are
        // trying to sort out authentication issues
        if (resp != null) {
            return resp;
        }

        // otherwise, ask for authentication so we can try again
        authenticate(AuthenticationReason.MISSING_IDENTITY);
        String token = getToken();
        while (token == null) {
            if (!authenticate(AuthenticationReason.CREDENTIALS_INVALID)) {
                break;
            }
            token = getToken();
        }

        if (token == null) {
            throw new NbtException("Authentication is required to access this resource");
        }

        request.getHeaders().set(NBT_TOKEN_HEADER, token);
        return request.execute();
    }

    protected String getToken() {
        return null;
    }

    protected boolean authenticate(AuthenticationReason reason) throws NbtException {
        return false;
    }
}
