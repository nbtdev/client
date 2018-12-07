package com.netbattletech.client.common;

import com.google.api.client.util.Key;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

public class EmbeddedCollectionResponse<E> extends HALResponse implements Iterable<E>{
    @Key
    protected HashMap<String, ArrayList<E>> _embedded;

    private ArrayList<E> empty = new ArrayList<>();

    @Override
    public Iterator<E> iterator() {
        if (_embedded == null) {
            return empty.iterator();
        }

        // ensure that there is at least one key/value pair in _embedded
        if (_embedded.size() != 1) {
            return empty.iterator();
        }

        // then, make sure that the value is a list type (necessary for this to be a proper EmbeddedCollectionResponse)
        Object value = _embedded.values().iterator().next();
        if (!(value instanceof List)) {
            return empty.iterator();
        }

        return ((List)value).iterator();
    }

    public boolean isEmpty() {
        if (_embedded == null) {
            return true;
        }

        if (_embedded.size() != 1) {
            return true;
        }

        return _embedded.values().iterator().next().isEmpty();
    }

    public Integer size() {
        if (_embedded == null) {
            return 0;
        }

        if (_embedded.size() != 1) {
            return 0;
        }

        return _embedded.values().iterator().next().size();
    }

    public E at(int index) {
        if (_embedded == null) {
            return null;
        }

        if (_embedded.size() != 1) {
            return null;
        }

        List<E> values = _embedded.values().iterator().next();
        if (index < 0 || index >= values.size()) {
            return null;
        }

        return values.get(index);
    }
}
