-- The owner confirmed these two exact records were tests and requested deletion.
DELETE FROM chenle_notes
WHERE (id = '3830b0e2-3e34-4cfa-969c-a4081dbb4be9' AND message = '哦，我真厉害')
   OR (id = 'a6a225fc-7e64-410b-b40c-e9b51c94a049' AND message = '1');
