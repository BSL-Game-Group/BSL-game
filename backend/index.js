const express = require('express')
const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.get('/api/test', (req, res) => {
  res.json({ message: 'API works' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})