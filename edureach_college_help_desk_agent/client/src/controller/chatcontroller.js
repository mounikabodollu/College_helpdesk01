import { getRAGResponse } from "../services/rag.service.js";


export const sendMessage = async (req, res, next) => {
    try {
        console.log("Chat request received");

        const { message } = req.body;

        console.log("User message:", message);

        /*
        |--------------------------------------------------------------------------
        | Validate message
        |--------------------------------------------------------------------------
        */

        if (
            !message ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Message is required and must be a non-empty string.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Get RAG response
        |--------------------------------------------------------------------------
        */

        console.log("Sending message to RAG...");

        const answer = await getRAGResponse(
            message.trim()
        );

        console.log("RAG response received");

        /*
        |--------------------------------------------------------------------------
        | Validate AI response
        |--------------------------------------------------------------------------
        */

        if (!answer) {
            return res.status(500).json({
                success: false,
                message:
                    "The AI service returned an empty response.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Send response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,
            data: {
                message: answer,
            },
        });
    } catch (error) {
        console.error(
            "Error in sendMessage controller:"
        );

        console.error(error);

        next(error);
    }
};