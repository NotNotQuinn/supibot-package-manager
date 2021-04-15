module.exports = {
	Name: "save-supibot-ping",
	Events: ["message"],
	Description: "This module saves supibot's latency to TMI, so it can be used to compare in wanductbots own ping command.",
	Code: (async function pingQuinn (context) {
		const { message, user, platform } = context;

        if (user.ID !== sb.User.get("supibot").ID) return;

        const regex = /^P.ng!.*Latency to TMI: (\d+)ms/

        let ping = regex.exec(message)[1];

        if (typeof ping !== "string") return;

        ping = Number(ping)

        this.data.supibot_latency = ping
	}),
	Author: "quinn"
};
