const { spawn } = require("node:child_process");
const { resolve } = require("node:path");

const root = resolve(__dirname, "..");
const project = resolve(root, "edureach_college_help_desk_agent");
const npmCli = process.env.npm_execpath;

if (!npmCli) {
	console.error("Could not locate npm. Run this script using `npm run dev`.");
	process.exit(1);
}

const children = [
	{
		name: "client",
		cwd: resolve(project, "client"),
	},
	{
		name: "server",
		cwd: resolve(project, "server"),
	},
].map(({ name, cwd }) => {
	const child = spawn(process.execPath, [npmCli, "run", "dev"], {
		cwd,
		stdio: "inherit",
	});

	child.on("error", (error) => {
		console.error(`Failed to start ${name}:`, error);
		shutdown(1);
	});

	child.on("exit", (code) => {
		if (!stopping) {
			console.error(`${name} stopped${code ? ` with exit code ${code}` : ""}.`);
			shutdown(code || 1);
		}
	});

	return child;
});

let stopping = false;

function shutdown(exitCode) {
	if (stopping) return;
	stopping = true;
	for (const child of children) {
		if (child.exitCode === null) child.kill();
	}
	process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
