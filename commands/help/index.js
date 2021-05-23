module.exports = {
	Name: "help",
	Aliases: ["commands","helpgrep"],
	Author: "supinic",
	Cooldown: 5000,
	Description: "Posts either: a short list of all commands, or a description of a specific command if you specify it.",
	Flags: ["mention","pipe"],
	Params: [
		{
			name: "force",
			type: "boolean"
		}
	],
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function help (context, ...args) {
		const prefix = sb.Command.prefix;
		const [commandString] = args;
		if (!commandString || context.invocation === "commands") {
			const key = { type: "commands-link-id" };
			let allCommandsPasteLink = context.params.force ? null : (await this.getCacheData(key));
			if (!allCommandsPasteLink) {
				const hastebin = require("hastebin-gen")
				let helpinfo = "The commands for Wanductbot:\n\n";
				/** @type {Array} */
				let commandsList = await sb.Query.getRecordset(rs => rs
						.select("Name")
						.from("chat_data", "command")
						.orderBy("Name ASC")
					)
				for (let i=0; i < commandsList.length; i++) {
					let command;

					command = sb.Command.get(commandsList[i].Name)
					if(!command) continue;

					const filteredResponse = (command.Flags?.whitelist) ? "(whitelisted)" : "";
					const aliases = (command.Aliases?.length === 0) ? "" : (" (" + command.Aliases.map(i => prefix + i).join(", ") + ")");
			
					helpinfo +=  [
						prefix + command.Name + aliases + ": " + filteredResponse,
						"    " + command.Description || "(no description)",
						"    " + sb.Utils.round(command.Cooldown / 1000, 2) + " seconds cooldown."
					].join("\n") + "\n\n";
					
				}
				let result;
				try {
					result = await hastebin(helpinfo, {
						url: "https://haste.zneix.eu",
						extension: "txt"
					});
				} catch (e) {
					console.error("commands paste error", { result, error: e })
					allCommandsPasteLink = await this.getCacheData(key);
					if(allCommandsPasteLink == null) return {
						success: false,
						reply: "Unable to post command data."
					};
					return {
						success: false,
						reply: ((!context.channel || context.channel.Links_Allowed)
						? `Commands information here: ${allCommandsPasteLink} Not refreshed (❗)`
						: `4Head almost the exact same as supibot.`)
					}
				}
				allCommandsPasteLink = result;
				await this.setCacheData(key, allCommandsPasteLink);
			}
		return {
			reply: (!context.channel || context.channel.Links_Allowed)
				? `Commands information here: ${allCommandsPasteLink}`
				: `4Head almost the exact same as supibot.`
		};
	}
		// No specified command - print all available commands in given channel for given user
		else if (context.invocation === "helpgrep") {
			const query = args.join(" ");
			const eligible = sb.Command.data.filter(command => command.Name.includes(query)
				|| command.Aliases.some(i => i.includes(query))
				|| command.Description?.includes(query)
			);

			return {
				success: (eligible.length !== 0),
				reply: (eligible.length === 0)
					? "No matching commands found!"
					: `Matching commands: ${eligible.map(i => i.Name).join(", ")}`
			};
		}
		// Print specific command description
		else {
			const identifier = (sb.Command.is(commandString))
				? commandString.replace(sb.Command.prefix)
				: commandString;
	
			if (identifier.toLowerCase() === "me") {
				return {
					reply: "I can't directly help you, but maybe if you use one of my commands, you'll feel better? :)"
				};
			}
	
			const command = sb.Command.get(identifier);
			if (!command) {
				return {
					reply: "That command does not exist!"
				};
			}
	
			const filteredResponse = (command.Flags.whitelist) ? "(whitelisted)" : "";
			const aliases = (command.Aliases.length === 0) ? "" : (` (${command.Aliases.map(i => prefix + i).join(", ")})`);

			const cooldownString = `${sb.Utils.round(command.Cooldown / 1_000, 1)} seconds cooldown.`;
			const cooldownModifier = sb.Filter.getCooldownModifiers({
				command,
				invocation: context.invocation,
				platform: context.platform,
				channel: context.channel ?? null,
				user: context.user
			});

			let modifierString = "";
			if (cooldownModifier) {
				const type = (cooldownModifier.Data.multiplier) ? "multiplier" : "override";
				const modified = sb.Utils.round(cooldownModifier.applyData(command.Cooldown) / 1000, 1);

				modifierString = `(you have a cooldown ${type} active - ${modified} seconds cooldown)`;
			}

			return {
				reply: sb.Utils.tag.trim `
					${prefix}${command.Name}${aliases}:
					${command.Description ?? "(no description)"}
					-
					${cooldownString}
					${modifierString}
					${filteredResponse}
					https://supinic.com/bot/command/${command.ID}
				`
			};
		}
	}),
	Dynamic_Description: null
};
