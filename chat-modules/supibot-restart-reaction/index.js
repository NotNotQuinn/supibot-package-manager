module.exports = {
	Name: "supibot-restart-reaction",
	Events: ["message"],
	Description: "React to supibot restarting, by restarting.",
	Code: (async function wannaBecomeFamous (context) {
        let messageToReactTo = 'VisLaud 👉 Restarting process';
        if (context.message === messageToReactTo && context.user.Name === "supibot" && context.channel.Name === "supinic") {
            console.log("RESTARTED!!! pog");
            let restart = sb.Command.get("restart");

            let responce = restart.Code(context);

            sb.Platform.get("twitch").client.say(context.channel.Name, responce.reply)
        }
		
	}),
	Author: "quinndt"
};