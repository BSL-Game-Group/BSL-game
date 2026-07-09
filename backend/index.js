const express = require('express')
const cors = require('cors')
const db = require('./models')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())

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
    const microbe = await db.Microbe.findOne({
      include: { model: db.BSLClass, as: 'bsl_class' },
      order: db.sequelize.random(),
      rejectOnEmpty: true
    })
    res.json(microbe)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch microbe' })
  }
})

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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
