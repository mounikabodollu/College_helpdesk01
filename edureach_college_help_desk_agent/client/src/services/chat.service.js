const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const sendMessage = async (message) => {
	let response;
	try {
		response = await fetch(`${API_URL}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message }),
		});
	} catch {
		throw new Error("Unable to reach the chat server. Start both services with `npm run dev` from the project root and try again.");
	}

	let result;
	try {
		result = await response.json();
	} catch {
		throw new Error("The chat server returned an invalid response.");
	}

	if (!response.ok || result.success === false) {
		throw new Error(result.message || "Unable to get a response right now.");
	}

	const answer = result.data?.message || result.message;
	if (typeof answer !== "string" || !answer.trim()) {
		throw new Error("The chat server returned an empty response.");
	}

	return { message: answer };
};
