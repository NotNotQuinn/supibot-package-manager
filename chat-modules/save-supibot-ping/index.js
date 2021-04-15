module.exports = {
	Name: "save-supibot-ping",
	Events: ["message"],
	Description: "This module saves supibot's latency to chat, so it can be used to compare in wanductbots own ping command.",
	Code: (async function saveSupibotPing (context) {
		const { message, user } = context;

        if (user.ID !== await sb.User.get("supibot").ID) return;

        const regex = /^P.ng!.*Latency to TMI: (\d+)ms/
        if (regex.test(message)) {
            let match = regex.exec(message);
            this.data.supibot_latency = match[1]
        }
	}),
	Author: "quinndt"
};
