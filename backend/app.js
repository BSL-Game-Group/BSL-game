const express = require('express')
const cors = require('cors')
const db = require('./models')
const authRouter = require('./routes/auth')
const roundsRouter = require('./routes/rounds')
const leaderboardRouter = require('./routes/leaderboard')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())

// Mounted above the pre-existing routes, and after express.json() so the routers
// see a parsed body.
app.use('/api/auth', authRouter)

// Mounted at /api rather than /api/rounds because this router also owns
// GET /api/me/rounds.
app.use('/api', roundsRouter)
app.use('/api', leaderboardRouter)

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.get('/api/test', async (req, res) => {
  try {
    const result = await db.sequelize.query('SELECT NOW() AS time')
    res.json({ message: 'Database connection works', time: result[0][0].time })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Database connection failed' })
  }
})

app.get('/api/bsl-classes', async (req, res) => {
  try {
    const classes = await db.BSLClass.findAll({ order: [['class_number', 'ASC']] })
    res.json(classes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch BSL classes' })
  }
})

app.get('/api/microbes', async (req, res) => {
  try {
    const microbes = await db.Microbe.findAll({
      include: { model: db.BSLClass, as: 'bsl_class' },
      order: [['id', 'ASC']],
    })
    res.json(microbes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch microbes' })
  }
})

app.get('/api/microbes/random', async (req, res) => {
  res.set('Cache-Control', 'no-store')
  try {
    const { session_id } = req.query;

    // 1. If we don't have a session ID, just return a pure random microbe (failsafe)
    if (!session_id) {
      const randomMicrobe = await db.Microbe.findOne({
        include: { model: db.BSLClass, as: 'bsl_class' },
        order: db.sequelize.random(),
        rejectOnEmpty: true
      });
      return res.json(randomMicrobe);
    }

    // 2. Find the current round, or create a blank one if the game just started
    const [round] = await db.Round.findOrCreate({
      where: { session_id: session_id },
      defaults: {
        score: 0,
        correct_count: 0,
        answer_count: 0,
        seen_microbes: []
      }
    });

    // 3. Get all microbe IDs
    const allMicrobes = await db.Microbe.findAll({ attributes: ['id'] });
    const allMicrobeIds = allMicrobes.map(m => m.id);

    // 4. Filter out the ones we've already seen
    let unseenIds = allMicrobeIds.filter(id => !round.seen_microbes.includes(id));

    // 5. Reset the list if we've seen them all
    if (unseenIds.length === 0) {
      round.seen_microbes = [];
      unseenIds = [...allMicrobeIds];
      console.log(`\n🔄 [RESET] All microbes seen for session ${session_id}. Resetting list.`);
    }

    // 6. Pick a random microbe from the UNSEEN list
    const nextMicrobeId = unseenIds[Math.floor(Math.random() * unseenIds.length)];

    // 7. Add it to the database list and save
    round.seen_microbes = [...round.seen_microbes, nextMicrobeId];
    await round.save();

    // ⭐️ HERE IS YOUR CONSOLE LOG ⭐️
    console.log(`\n🎮 [Session: ${session_id}]`);
    console.log(`👀 Just drew Microbe ID: ${nextMicrobeId}`);
    console.log(`📋 Total Seen List: [${round.seen_microbes.join(', ')}]\n`);

    // 8. Fetch full microbe data to send to frontend
    const microbe = await db.Microbe.findByPk(nextMicrobeId, {
      include: { model: db.BSLClass, as: 'bsl_class' }
    });

    res.json(microbe);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch microbe' })
  }
})

app.post('/api/microbes/reset', async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (session_id) {
      await db.Round.update(
        { seen_microbes: [] },
        { where: { session_id: session_id } }
      );
      console.log(`\n🧹 [RESET] Emptied microbe list for session ${session_id}\n`);
    }
    
    res.status(200).json({ message: 'Session reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset session microbes' });
  }
});

app.get('/api/microbes/:id', async (req, res) => {
  try {
    const microbe = await db.Microbe.findByPk(req.params.id, {
      include: { model: db.BSLClass, as: 'bsl_class' },
    })
    if (!microbe) {
      return res.status(404).json({ error: 'Microbe not found' })
    }
    res.json(microbe)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch microbe' })
  }
})

app.get('/api/bsl-material', async (req, res) => {
  try {
    const lang = req.query.lang || 'en'
    let row = await db.BSLMaterial.findByPk(lang)
    if (!row) {
      row = await db.BSLMaterial.findByPk('en')
    }
    res.json(row.content)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch BSL material' })
  }
})

app.post('/api/rooms/enter', async (req, res) => {
  try {
    const { room_key, session_id } = req.body
    
    if (!room_key || !session_id) {
      return res.status(400).json({ error: 'Missing room_key or session_id' })
    }

    await db.RoomEntry.create({
      session_id,
      room_key,
    })

    // Extract room number from room_key (e.g., "BSL-1" -> "1")
    const roomNumber = room_key.split('-')[1] || room_key
    
    res.status(201).json({ room_number: roomNumber })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to record room entry' })
  }
})

app.use(errorHandler)

module.exports = app
