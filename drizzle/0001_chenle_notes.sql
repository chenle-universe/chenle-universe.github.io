CREATE TABLE chenle_notes (
 id TEXT PRIMARY KEY NOT NULL,
 message TEXT NOT NULL,
 sender TEXT NOT NULL DEFAULT '',
 location TEXT NOT NULL DEFAULT '',
 language TEXT NOT NULL CHECK(language IN ('zh','ko','en')),
 style_variant TEXT NOT NULL,
 text_color TEXT NOT NULL,
 stickers TEXT NOT NULL DEFAULT '[]',
 created_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 actor TEXT NOT NULL,
 network TEXT NOT NULL,
 day TEXT NOT NULL
);
CREATE INDEX chenle_notes_status_time ON chenle_notes(status,created_at);
CREATE INDEX chenle_notes_actor_day ON chenle_notes(actor,day);
CREATE INDEX chenle_notes_network_day ON chenle_notes(network,day);
