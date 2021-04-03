module.exports = {
	Name: "supibot-restart-reaction",
	Events: ["message"],
	Description: "React to supibot restarting, by restarting.",
	Code: (async function wannaBecomeFamous (context) {

        console.log(context)

		const msg = sb.Utils.removeAccents(context.message).toLowerCase();

		const { client } = context.channel.Platform;
		
	}),
	Author: "quinndt"
};