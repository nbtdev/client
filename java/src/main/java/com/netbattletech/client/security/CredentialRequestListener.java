package com.netbattletech.client.security;

public interface CredentialRequestListener {
    LoginCredentials loginCredentialRequest(Reason reason);

    enum Reason {
        MISSING_IDENTITY,
        CREDENTIALS_INVALID,
        UNKNOWN,
    }
}
