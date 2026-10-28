import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import checkEnv from './config/checkEnv.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  checkEnv();
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Entorno: ${process.env.NODE_ENV}`);
  });
};

startServer();