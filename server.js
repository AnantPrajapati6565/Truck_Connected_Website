// This imports app from src/
const app = require('./src/app');
const { connectDB } = require('./src/config/prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    console.log("✅ Database connected");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("❌ Server failed to start:", error.message);
    process.exit(1);
  }
}

startServer();