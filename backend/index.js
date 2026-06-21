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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
