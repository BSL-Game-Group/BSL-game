const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432
})

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      message: 'Database connection works',
      time: result.rows[0]
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Database connection failed' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})