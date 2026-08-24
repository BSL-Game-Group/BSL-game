const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');

// Editing a file in backend/data/ changes nothing in a database that has already
// been seeded: seeders run exactly once per database and are never re-run, so the
// rows keep whatever they were first given. Only a new migration reaches an
// existing database.
//
// CI cannot notice this on its own, because it always builds a fresh database
// where the seeder writes the current files anyway. So the guard cannot compare
// the database to the files — it has to compare the files to the last migration
// that copied them into existing databases. That is what this fingerprint is for:
// each such migration records the fingerprint of the data it copied, and a test
// fails as soon as the files no longer match it.
//
// Parsing and re-stringifying normalises formatting, so reindenting a data file
// does not demand a migration — only a real content change does.
function fingerprintOf(fileNames) {
  const hash = createHash('sha256');

  for (const fileName of fileNames) {
    const fullPath = path.join(__dirname, '..', '..', 'data', fileName);
    const parsed = JSON.parse(readFileSync(fullPath, 'utf8'));

    hash.update(fileName);
    hash.update(JSON.stringify(parsed));
  }

  return hash.digest('hex');
}

module.exports = { fingerprintOf };
