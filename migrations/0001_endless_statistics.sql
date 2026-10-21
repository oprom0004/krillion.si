CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS first_answers (
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  question_id TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  PRIMARY KEY (visitor_id, question_id)
);
CREATE INDEX IF NOT EXISTS first_answers_question ON first_answers(question_id, answer_id);
CREATE TABLE IF NOT EXISTS score_snapshots (
  day TEXT NOT NULL,
  question_id TEXT NOT NULL,
  sample_size INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  PRIMARY KEY (day, question_id)
);
