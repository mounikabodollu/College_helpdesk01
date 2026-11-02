import cors from "cors";
import express from "express";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRoutes);

app.get("/api/health", (_req, res) => {
	res.json({ success: true });
});

export default app;
