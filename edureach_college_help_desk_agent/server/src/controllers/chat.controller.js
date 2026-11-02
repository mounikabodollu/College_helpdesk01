import { getRAGResponse } from "../services/rag.service.js";

export const sendMessage = async (req, res) => {
	const message = req.body?.message;

	if (typeof message !== "string" || !message.trim()) {
		return res.status(400).json({
			success: false,
			message: "Message is required and must be a non-empty string.",
		});
	}

	try {
		const answer = await getRAGResponse(message.trim());
		return res.json({ success: true, data: { message: answer } });
	} catch (error) {
		console.error("Failed to answer chat request:", error);
		return res.status(500).json({
			success: false,
			message: "The chat service could not answer right now. Please try again.",
		});
	}
};
