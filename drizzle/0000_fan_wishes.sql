CREATE TABLE fan_wishes (
 id TEXT PRIMARY KEY NOT NULL,
 wish_id TEXT NOT NULL CHECK(wish_id IN ('happy','music','health','dream','smile','together')),
 actor TEXT NOT NULL,
 network TEXT NOT NULL,
 day TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 UNIQUE(actor, day)
);
CREATE INDEX fan_wishes_recent ON fan_wishes(created_at);
CREATE INDEX fan_wishes_network_day ON fan_wishes(network, day);
