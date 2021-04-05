module.exports = {
	Name: "supibot-restart-reaction",
	Events: ["message"],
	Description: "React to supibot restarting.",
	Code: (async function wannaBecomeFamous (context) {
        let messageToReactTo = 'ppCircle';
        if (context.message === messageToReactTo && context.user.Name === "supibot" && context.channel.Name === "supinic") {
            sb.Platform.get("twitch").client.say(context.channel.Name, "ppCircleHeat ￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼￼ ppOverheat")
        }
	}),
	Author: "quinndt"
};