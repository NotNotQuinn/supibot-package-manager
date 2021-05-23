module.exports = {
	Name: "followage",
	Aliases: ["fa"],
	Author: "supinic",
	Cooldown: 10000,
	Description: "Fetches the followage <user> <channel>. If no channel provided, checks the current one. If no user provided either, checks yourself.",
	Flags: ["mention","non-nullable","pipe"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function followAge (context, user, channel) {
		if (!channel && user) {
			channel = user;
			user = context.user.Name;
		}
	
		if (!channel) {
			if (!context.channel) {
				return {
					success: false,
					reply: "There is no channel to use here!"
				};
			}
	
			if (context.platform.Name === "twitch") {
				channel = context.channel.Name;
			}
			// If used in a mirrored channel outside of Twitch, use the mirror target channel instead.
			else if (context.channel.Mirror) {
				const mirrorChannel = sb.Channel.get(context.channel.Mirror);
				if (mirrorChannel.Platform.Name === "twitch") {
					channel = mirrorChannel.Name;
				}
			}
	
			if (!channel) {
				return {
					success: false,
					reply: "Could not find any associated Twitch channels! Please specify one."
				};
			}
		}
	
		if (!user) {
			user = context.user.Name;
		}
	
		if (user === channel.toLowerCase()) {
			if (user === context.user.Name) {
				const emote = await context.platform.getBestAvailableEmote(
					context.channel,
					["PepeLaugh", "pepeLaugh", "LULW", "LuL", "LUL", "4HEad", "4Head"],
					"😀"
				);

				return {
					success: false,
					reply: `Good luck following yourself! ${emote}`
				};
			}
			else {
				const emote = await context.platform.getBestAvailableEmote(
					context.channel,
					["FeelsDankMan", "FailFish"],
					"🙄"
				);

				return {
					success: false,
					reply: `People can't follow themselves! ${emote}`
				};
			}
		}
	
		const { controller } = sb.Platform.get("twitch");
		const [userID, channelID] = await Promise.all([
			controller.getUserID(user),
			controller.getUserID(channel)
		]);
	
		if (!userID || !channelID) {
			return {
				success: false,
				reply: "One or both users were not found!"
			};
		}
	
		const { body: data } = await sb.Got("Kraken", {
			url: `users/${userID}/follows/channels/${channelID}`,
			throwHttpErrors: false
		});
	
		const prefix = (user.toLowerCase() === context.user.Name) ? "You" : user;
		const suffix = (channel.toLowerCase() === context.user.Name) ? "you" : channel;

		if (data.error && data.status === 404) {
			const verb = (user.toLowerCase() === context.user.Name) ? "are" : "is";
			return {
				reply: `${prefix} ${verb} not following ${suffix}.`
			};
		}
		else {
			const verb = (user.toLowerCase() === context.user.Name) ? "have" : "has";
			const delta = sb.Utils.timeDelta(new sb.Date(data.created_at), true);
			return {
				reply: `${prefix} ${verb} been following ${suffix} for ${delta}.`
			};
		}
	}),
	Dynamic_Description: null
};
