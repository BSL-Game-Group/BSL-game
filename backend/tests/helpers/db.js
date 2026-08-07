const db = require('../../models');

// Child tables first, so `cascade` never has to reach back for them.
const TABLES = ['RoundAnswer', 'Round', 'User'];

// TRUNCATE rather than destroy-by-where: it resets the identity sequences too, so
// ids are predictable per test file. Models are skipped if they do not exist yet —
// the tasks that add them come after the first tests that call this.
async function resetGameTables() {
  for (const name of TABLES) {
    const model = db[name];

    if (!model) {
      continue;
    }

    await model.destroy({ truncate: true, cascade: true, restartIdentity: true });
  }
}

async function closeDb() {
  await db.sequelize.close();
}

module.exports = { resetGameTables, closeDb };
