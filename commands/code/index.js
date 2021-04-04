module.exports = {
	Name: "code",
	Aliases: null,
	Author: "supinic",
	Cooldown: 5000,
	Description: "Posts a link to a specific command's code definition on github.",
	Flags: ["developer","mention","pipe"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function code (context, commandString) {
		if (!commandString) {
			return {
				success: false,
				reply: "No command provided!",
				cooldown: 2500
			};
		}
	
		const command = sb.Command.get(commandString);
		if (!command) {
			return {
				success: false,
				reply: "Provided command does not exist!",
				cooldown: 2500
			};
		}
	
		return {
			reply: `Github: https://github.com/Supinic/supibot-package-manager/blob/custom/commands/${command.Name}/index.js`
		};	
	}),
	Dynamic_Description: null
};