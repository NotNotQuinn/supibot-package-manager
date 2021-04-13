module.exports = {
	Name: "firstchannelfollower",
	Aliases: ["fcf"],
	Author: "supinic",
	Cooldown: 10000,
	Description: "Fetches the first user that follows you or someone else on Twitch.",
	Flags: ["mention","non-nullable","opt-out","pipe"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function firstChannelFollower (context, target) {
		const { controller } = sb.Platform.get("twitch");
		const channelID = await controller.getUserID(target ?? context.user.Name);
		if (!channelID) {
			return {
				success: false,
				reply: "Could not match user to a Twitch user ID!"
			};
		}
	
		const { follows } = await sb.Got("Kraken", {
			url: `channels/${channelID}/follows`,
			searchParams: new sb.URLParams()
				.set("direction", "asc")
				.toString()
		}).json();
	
		const who = (!target || context.user.Name === target.toLowerCase())
			? "you"
			: "they";
	
		if (follows.length === 0) {
			return {
				reply: `${sb.Utils.capitalize(who)} don't have any followers.`
			};
		}
		else {
			const follow = follows[0];
			const delta = sb.Utils.timeDelta(new sb.Date(follow.created_at));
			return {
				reply: `The oldest follower ${who} have is ${follow.user.name}, since ${delta}.`
			};
		}
	}),
	Dynamic_Description: null
};