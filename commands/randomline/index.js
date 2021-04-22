module.exports = {
	Name: "randomline",
	Aliases: ["rl","rq"],
	Author: "supinic",
	Cooldown: 15000,
	Description: "Fetches a random line from the current channel. If a user is specified, fetches a random line from that user only. \"rq\" only chooses from your own lines.",
	Flags: ["block","opt-out","pipe","use-params"],
	Params: [
		{ name: "textOnly", type: "boolean" }
	],
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function randomLine (context, user) {
		if (context.channel === null) {
			return {
				reply: "This command cannot be used in private messages!"
			};
		}
	
		const channelName = context.channel.getDatabaseName();
		const channelID = context.channel.ID;
		let result = null;
	
		if (context.invocation === "rq") {
			user = context.user.Name;
		}
	
		if (user) {
			const targetUser = await sb.User.get(user);
			if (!targetUser) {
				return {
					reply: "User not found in the database!"
				};
			}

			const data = await sb.Query.getRecordset(rs => rs
				.select("Message_Count AS Count")
				.from("chat_data", "Message_Meta_User_Alias")
				.where("User_Alias = %n", targetUser.ID)
				.where("Channel = %n", channelID)
				.single()
			);

			if (!data) {
				return {
					reply: "That user has not posted any messages in this channel!"
				};
			}
			else if (!data.Count) {
				return {
					reply: "That user has no metadata associated with them!"
				};
			}

			const random = await sb.Query.getRecordset(rs => rs
				.select("ID")
				.from("chat_line", channelName)
				.where("User_Alias = %n", targetUser.ID)
				.limit(1)
				.offset(sb.Utils.random(1, data.Count) - 1)
				.single()
			);

			if (!random) {
				return {
					reply: "No messages could be fetched!"
				};
			}

			result = await sb.Query.getRecordset(rs => rs
				.select("Text", "Posted", `"${targetUser.Name}" AS Name`)
				.from("chat_line", channelName)
				.where("ID >= %n", random.ID)
				.orderBy("ID ASC")
				.limit(1)
				.single()
			);

		}
		else {
			const data = await sb.Query.getRecordset(rs => rs
				.select("MAX(ID) AS Total")
				.from("chat_line", channelName)
				.single()
			);

			if (!data || !data.Total) {
				return {
					reply: "This channel doesn't have enough chat lines saved yet!"
				};
			}

			result = await sb.Query.getRecordset(rs => rs
				.select("Text", "Posted", "Name")
				.from("chat_line", channelName)
				.join("chat_data", "User_Alias")
				.where("`" + channelName + "`.ID >= %n", sb.Utils.random(1, data.Total))
				.orderBy("`" + channelName + "`.ID ASC")
				.limit(1)
				.single()
			);
		}
	
		const partialReplies = [{
			bancheck: true,
			message: result.Text
		}];
	
		// Only add the "(time ago) name:" part if it was not requested to skip it
		if (!context.params.textOnly) {
			partialReplies.unshift(
				{
					bancheck: false,
					message: `(${sb.Utils.timeDelta(result.Posted)})`
				},
				{
					bancheck: true,
					message: `${result.Name}:`
				}
			);
		}
	
		return {
			partialReplies
		};
	}),
	Dynamic_Description: (async (prefix) => [
		"Fetches a random chat line from the current channel.",
		"If you specify a user, the line will be from that user only.",
		"",
	
		`<code>${prefix}rl</code>`,
		`Random message from anyone, in the format "(time ago) (username): (message)"`,
		"",
	
		`<code>${prefix}rl (user)</code>`,
		"Random message from specified user only",
		"",
	
		`<code>${prefix}rq</code>`,
		"Random message from yourself only",
		"",
	
		`<code>${prefix}rl (user) textOnly:true</code>`,
		`Will only reply with the message, ignoring the "(time ago) (name):" part`,
		"",
	])
};