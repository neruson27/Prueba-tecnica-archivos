import express from 'express'
import cors from 'cors';
import defineRoutes from './routes.js'

const app = express()
const port = 3000

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/health', (req, res) => {
  res.send('File IO Backend is running')
})

defineRoutes(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})