module.exports = {
	Name: "shoutout",
	Aliases: ["so"],
	Author: "supinic",
	Cooldown: 30000,
	Description: "Shouts out a given streamer (Twitch only), and posts the last game they played as well.",
	Flags: ["mention"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function shoutout (context, target) {
		if (!target) {
			return {
				success: false,
				reply: "No user provided!"
			};
		}
	
		const { controller } = sb.Platform.get("twitch");
		const targetUserID = await controller.getUserID(target);
		if (!targetUserID) {
			return {
				success: false,
				reply: "Cannot find that user on Twitch!"
			};
		}
		else if (targetUserID === context.user.Twitch_ID) {
			return {
				success: false,
				reply: "This isn't going to make you any more famous, you got to put the work in yourself!"
			};
		}
	
		const { statusCode, body: data } = await sb.Got("Kraken", `channels/${targetUserID}`);
		if (statusCode === 422) {
			return {
				success: false,
				reply: "That user is currently banned!"
			};
		}
		else if (statusCode !== 200) {
			console.warn({ statusCode, data });
			return {
				success: false,
				reply: "Cannot find that user's last stream data!"
			};
		}
	
		const { game, name, url } = data;
		const gameString = (game !== null)
			? `They last streamed in game/category ${game}.`
			: "";
	
		return {
			reply: sb.Utils.tag.trim `Shout out to ${name}! ${gameString} Check them out here: ${url}`
		};
	}),
	Dynamic_Description: null
};
