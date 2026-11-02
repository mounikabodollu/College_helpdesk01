import app from "./app.js";
import connectDB from "./config/database.config.js";
import { initializeKnowledgeBase } from "./services/rag.service.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        console.log("Connecting to MongoDB...");

        await connectDB();

        console.log("MongoDB connected successfully.");

        console.log("Initializing knowledge base...");

        await initializeKnowledgeBase();

        console.log("Knowledge base ready.");

        app.listen(PORT, () => {
            console.log("----------------------------------------");
            console.log(`Server running on port ${PORT}`);
            console.log(`http://localhost:${PORT}`);
            console.log("----------------------------------------");
        });
    } catch (error) {
        console.error("----------------------------------------");
        console.error("SERVER STARTUP FAILED");
        console.error("----------------------------------------");

        console.error(error.message || error);

        process.exit(1);
    }
};

start();




