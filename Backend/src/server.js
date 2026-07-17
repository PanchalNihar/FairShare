import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/database.js";
import { startScheduler } from "./services/scheduler.service.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    await connectDB();

    // Start background recurring expense checker daemon
    startScheduler();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT} (all interfaces)`);
    });

};

startServer();