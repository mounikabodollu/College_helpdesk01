import app from "./app.js";
import { initializeKnowledgeBase } from "./services/rag.service.js";

const PORT = process.env.PORT || 5000;

await initializeKnowledgeBase();

app.listen(PORT, () => {
	console.log(`EduReach chat API listening on http://localhost:${PORT}`);
});
