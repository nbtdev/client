package com.netbattletech.client.security;

public interface Identity {
    String name();
    Integer userId();
    String token();
}
