import 'dotenv/config'
import { createApp } from './src/app.js'
import { connectDB } from './src/config/db.js'

const PORT = process.env.PORT ?? 5000

async function main() {
  // Connect to MongoDB before accepting requests
  await connectDB()

  const app = createApp()

  app.listen(PORT, () => {
    console.log(`🚀 AetherHealth API running on http://localhost:${PORT}`)
    console.log(`   Health check: http://localhost:${PORT}/api/health`)
  })
}

main()
