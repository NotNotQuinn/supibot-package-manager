module.exports = {
	Name: "lastline",
	Aliases: ["ll","lastmessage","lm"],
	Author: "supinic",
	Cooldown: 5000,
	Description: "Posts the target user's last chat line in the context of the current channel, and the date they sent it.",
	Flags: ["external-input","mention","opt-out","pipe","use-params"],
	Params: [
		{ name: "textOnly", type: "boolean" }
	],
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function lastLine (context, user) {
		if (!user) {
			return { reply: "No user provided!" };
		}
		else if (!context.channel) {
			return { reply: "This command is not available in PMs!" };
		}
	
		const targetUser = await sb.User.get(user, true);
		if (!targetUser) {
			return { reply: "User not found in the database!" };
		}
	
		const userID = targetUser.ID;
		if (userID === context.user.ID) {
			return { reply: "You're right here NaM I can see you" };
		}
	
		let data = (await sb.Query.getRecordset(rs => rs
				.select("Last_Message_Text AS Message", "Last_Message_Posted AS Posted")
				.from("chat_data", "Message_Meta_User_Alias")
				.where("User_Alias = %n", userID)
				.where("Channel = %n", context.channel.ID)
			))[0];
		
		if (!data) {
			return { reply: "That user has not said anything in this channel!" };
		}

		if (context.params.textOnly) {
			return {
				reply: data.Message
			};
		}

		const prefix = (targetUser.ID === context.user.ID) ? "Your" : "That user's";
		return {
			partialReplies: [
				{
					bancheck: false,
					message: `${prefix} last message in this channel was (${sb.Utils.timeDelta(data.Posted)}):`
				},
				{
					bancheck: true,
					message: data.Message
				}
			]
		};
	}),
	Dynamic_Description: null
};
