import { readFile } from "node:fs/promises";

const knowledgeBaseUrl = new URL("../../knowledge-base/edureach-knowledge.txt", import.meta.url);
const stopWords = new Set([
	"a", "about", "an", "are", "can", "do", "for", "from", "how", "i", "in", "is",
	"me", "of", "please", "tell", "the", "to", "what", "when", "where", "which", "who",
	"with", "you",
]);
const relatedTerms = [
	["admission", "admissions", "apply", "application", "eligibility", "eligible"],
	["course", "courses", "program", "programs", "degree", "degrees"],
	["fee", "fees", "cost", "tuition", "payment", "scholarship"],
	["placement", "placements", "job", "jobs", "career", "recruiter", "recruiters"],
	["hostel", "hostels", "accommodation", "dorm"],
];

let knowledgeLines = [];

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const initializeKnowledgeBase = async () => {
	const content = await readFile(knowledgeBaseUrl, "utf8");
	let section = "";
	knowledgeLines = content.split(/\r?\n/).reduce((lines, rawLine) => {
		const line = rawLine.trim();
		if (!line) return lines;
		if (/^[A-Z][A-Z0-9 &'()-]+$/.test(line) || /^[A-Za-z. &()0-9-]+:$/.test(line)) {
			section = line;
		} else {
			lines.push({ text: line, section });
		}
		return lines;
	}, []);

	if (knowledgeLines.length === 0) {
		throw new Error("The EduReach knowledge base is empty.");
	}
};

export const getRAGResponse = async (message) => {
	if (knowledgeLines.length === 0) {
		await initializeKnowledgeBase();
	}

	const queryWords = normalize(message).split(/\s+/).filter((word) => word && !stopWords.has(word));
	const directTerms = new Set(queryWords.map((word) => word.endsWith("s") ? word.slice(0, -1) : word));
	const activeGroups = relatedTerms.filter((group) => (
		group.some((term) => queryWords.includes(term) || directTerms.has(term))
	));
	const matches = knowledgeLines
		.map(({ text, section }) => {
			const normalizedText = ` ${normalize(text)} `;
			const normalizedSection = ` ${normalize(section)} `;
			const directScore = [...directTerms].reduce((total, term) => (
				normalizedText.includes(` ${term} `) ? total + 3 : total
			), 0);
			const relatedScore = activeGroups.reduce((total, group) => {
				const sectionMatch = group.some((term) => normalizedSection.includes(` ${term} `));
				const contentMatch = group.some((term) => normalizedText.includes(` ${term} `));
				return total + (sectionMatch ? 4 : contentMatch ? 1 : 0);
			}, 0);
			return { text, score: directScore + relatedScore };
		})
		.filter((item) => item.score > 0)
		.sort((first, second) => second.score - first.score)
		.slice(0, 5)
		.map((item) => item.text);

	if (matches.length === 0) {
		return "I couldn't find that in the EduReach information I have. Please try asking about courses, fees, admissions, placements, or campus life, or contact info@edureach.edu.in.";
	}

	return matches.join("\n\n");
};
