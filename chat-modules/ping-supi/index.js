module.exports = {
	Name: "ping-quinn",
	Events: ["message"],
	Description: "This module notifies QuinnDT whenever he is mentioned (in any channel, across platforms) via Twitch whispers.",
	Code: (async function pingQuinn (context) {
		const { message, channel, user } = context;
		const regex = /q+u+[i1l\|]+nn+/i;
	
		if (typeof this.data.timeout === "undefined") {
			this.data.timeout = 0;
		}
		
		const now = sb.Date.now();
		if (now > this.data.timeout && regex.test(message) && !user?.Data.skipGlobalPing) {
			const userName = user?.Name ?? `❓${context.raw.user}`;

			this.data.timeout = now + 1000;
	
			const pingMessage = `[#${channel.Description ?? channel.Name}] ${userName}: ${message}`;
			await sb.Platform.get("twitch").pm(pingMessage, await sb.User.get("quinndt"));
		}
	}),
	Author: "supinic"
};