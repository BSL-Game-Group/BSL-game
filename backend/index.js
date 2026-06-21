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
    await db.sequelize.authenticate()
    res.json({ message: 'Database connection works' })
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
