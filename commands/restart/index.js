module.exports = {
	Name: "restart",
	Aliases: null,
	Author: "supinic",
	Cooldown: 0,
	Description: "Restarts the bot/website process, optionally also git-pulls changes and/or upgrades the supi-core module.",
	Flags: ["read-only","system","whitelist"],
	Params: [
		{
			name: "branch",
			type: "string"
		},
		{
			name: "upstream",
			type: "boolean"
		}
	],
	Whitelist_Response: "Only available to administrators!",
	Static_Data: (() => ({
		dir: {
			bot: "d:\\dev\\node\\not-my-stuff\\supibot",
			web: ""
		},
		start: {
			bot: "npm run debug --prefix d:\\dev\\node\\not-my-stuff\\supibot",
			web: "echo \"Fatal error: Web does not exist!!!\" && exit 1"
		}
	})),
	Code: (async function restart (context, ...types) {
		const { promisify } = require("util");
		const shell = promisify(require("child_process").exec);
		const processType = (types.includes("web") || types.includes("site") || types.includes("website"))
			? "web"
			: "bot";
	
		types = types.map(i => i.toLowerCase());
	
		const queue = [];
		const dir = this.staticData.dir[processType];
		const start = this.staticData.start[processType];
		const respond = (context.channel)
			? (string) => context.channel.send(string)
			: (string) => context.platform.pm(string, context.user.Name);
	
		if (types.includes("all") || types.includes("pull")) {
			queue.push(async () => {
				let source = context.params.upstream ? "upstream" : "origin"
				let branch = context.params.branch ?? (context.params.upstream ? sb.Config.get("DEFAULT_UPSTREAM_GIT_BRANCH_NAME") : sb.Config.get("DEFAULT_ORIGIN_GIT_BRANCH_NAME"))
				await respond(`VisLaud 👉 git pull ${source} ${branch}`);
	
				await shell(`git -C ${dir} checkout -- yarn.lock package.json`);
				const result = await shell(`git -C ${dir} pull ${source} ${branch}`);
				console.log("pull result", { stdout: result.stdout, stderr: result.stderr });
			});
		}
		if (types.includes("all") || types.includes("yarn") || types.includes("upgrade")) {
			queue.push(async () => {
				await respond("VisLaud 👉 yarn upgrade supi-core");
	
				const result = await shell(`yarn --cwd ${dir} upgrade supi-core`);
				console.log("upgrade result", { stdout: result.stdout, stderr: result.stderr });
			});
		}
	
		queue.push(async () => {
			await respond("VisLaud 👉 Restarting process");
			setTimeout(() => shell(start), 1000);
		});
	
		for (const fn of queue) {
			await fn();
		}
	
		return null;
	}),
	Dynamic_Description: null
};