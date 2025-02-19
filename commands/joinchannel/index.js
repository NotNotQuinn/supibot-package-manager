module.exports = {
	Name: "joinchannel",
	Aliases: null,
	Author: "supinic",
	Cooldown: 0,
	Description: "Adds a new channel to database, sets its tables and events, and joins it. Only applicable for Twitch channels (for now, at least).",
	Flags: ["mention","pipe","system","whitelist"],
	Params: [
		{ name: "platform", type: "string" },
		{ name: "silent", type: "boolean" }
	],
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function joinChannel (context, channel, mode) {
		if (!channel.includes("#")) {
			return {
				success: false,
				reply: "Channels must be denominated with #, as a safety measure!"
			};
		}
		else if (mode && mode !== "Read") {
			return {
				success: false,
				reply: `Only additional mode available is "Read"!`
			};
		}

		channel = channel.replace("#", "").toLowerCase();

		const platformName = context.params.platform ?? "twitch";
		const existing = sb.Channel.get(channel, platformName);
		if (existing) {
			return {
				success: false,
				reply: `This channel already exists in the database, with mode = ${existing.Mode}!`
			};
		}

		let channelData;
		if (platformName === "twitch") {
			const platformData = sb.Platform.get("twitch");
			const channelID = await platformData.controller.getUserID(channel);
			if (!channelID) {
				return {
					success: false,
					reply: "Provided channel does not exist on Twitch!"
				};
			}

			await sb.Channel.add(channel, platformData, mode ?? "Write", channelID);
			await platformData.client.join(channel);

			channelData = sb.Channel.get(channel);
		}
		else if (platformName === "cytube") {
			const platformData = sb.Platform.get("cytube");

			channelData = await sb.Channel.add(channel, platformData, mode ?? "Write");
			await platformData.controller.joinChannel(channelData);
		}
		else {
			return {
				success: false,
				reply: "Invalid or unsupported platform provided!"
			};
		}

		if (channelData && !context.params.silent) {
			const emote = await channelData.getBestAvailableEmote(["MrDestructoid"], "🤖");
			await channelData.send(`${emote} 👍 Successfully joined!`);
		}

		return {
			reply: "Success."
		};
	}),
	Dynamic_Description: null
};
