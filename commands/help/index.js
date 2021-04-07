module.exports = {
	Name: "help",
	Aliases: ["commands","helpgrep"],
	Author: "supinic",
	Cooldown: 5000,
	Description: "Posts either: a short list of all commands, or a description of a specific command if you specify it.",
	Flags: ["mention","pipe"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function help (context, ...args) {
		const prefix = sb.Config.get("COMMAND_PREFIX");
		const [commandString] = args;
		if (!commandString || context.invocation === "commands") {
			const key = { type: "all-commands-description-paste-id" };
			let allCommandsPasteID = await this.getCacheData(key);
			if (!allCommandsPasteID) {
				let helpinfo = "The commands for Wanductbot:\n\n";
				let commandsList = sb.Query.getRecordset(rs => rs
						.select("Name", "Description", "Cooldown", "ID", "Aliases")
						.from("chat_data", "command")
						.orderBy("Name ASC")
					)
				for (let i=0; i < commandsList.length; i++) {
					let cmd = commandsList[i]
					let aliases = "";
					if(typeof cmd.Aliases === "string") {
						aliases = ` (${JSON.parse(cmd.Aliases).map(i => `${prefix}${i}`).join(", ")})`
					}
					helpinfo += `${cmd.name}${aliases}`
					helpinfo += ` - ${cmd.Description}\n`
				}

				const result = await sb.Pastebin.post(helpinfo, {
					name: `All commands list for Wanductbot!`,
					expiration: "1D"
				});

				if (result.success !== true) {
					console.error("commands paste error", { result })
					return {
						success: false,
						reply: "Something went wrong posing the paste, and there wasnt one cached, sorry!"
					};
				}
				let splitPasteLink = result.body.split("/")
				allCommandsPasteID = splitPasteLink[splitPasteLink.length - 1];
				await this.setCacheData(key, allCommandsPasteID, {
					expiry: 863e5
				});
			}
			return {
				reply: (!context.channel || context.channel.Links_Allowed)
					? `Commands information here: https://pastebin.com/${allCommandsPasteID}`
					: `pastebin dot com // Commands: ${allCommandsPasteID}`
			};
		}
			};
		}
		else if (context.invocation === "helpgrep") {
			const query = args.join(" ");
			const eligible = sb.Command.data.filter(command =>
				command.Name.includes(query)
				|| command.Aliases.some(i => i.includes(query))
				|| command.Description?.includes(query)
			);

			return {
				success: (eligible.length !== 0),
				reply: (eligible.length === 0)
					? "No matching commands found!"
					: "Matching commands: " + eligible.map(i => i.Name).join(", ")
			};
		}
		// Print specific command description
		else {
			const identifier = (sb.Command.is(commandString))
				? commandString.replace(sb.Command.prefix)
				: commandString;
	
			if (identifier.toLowerCase() === "me") {
				return { reply: "I can't directly help you, but maybe if you use one of my commands, you'll feel better? :)" };
			}
	
			const command = sb.Command.get(identifier);
			if (!command) {
				return { reply: "That command does not exist!" };
			}
	
			const filteredResponse = (command.Flags.whitelist) ? "(whitelisted)" : "";
			const aliases = (command.Aliases.length === 0) ? "" : (" (" + command.Aliases.map(i => prefix + i).join(", ") + ")");
	
			const reply = [
				prefix + command.Name + aliases + ":",
				command.Description || "(no description)",
				"- " + sb.Utils.round(command.Cooldown / 1000, 1) + " seconds cooldown.",
				filteredResponse,
				"https://supinic.com/bot/command/" + command.ID
			];
	
			return { reply: reply.join(" ") };
		}
	}),
	Dynamic_Description: null
};