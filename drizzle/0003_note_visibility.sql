ALTER TABLE chenle_notes ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','private'));
CREATE INDEX chenle_notes_public_visibility_time ON chenle_notes(visibility,status,created_at);
