module.exports = {
	Name: "check",
	Aliases: null,
	Author: "supinic",
	Cooldown: 10000,
	Description: "Checks certain user or system variables. For a list of types, check the command's extended help.",
	Flags: ["mention","pipe"],
	Params: [
		{
			name: "private",
			type: "boolean"
		}
	],
	Whitelist_Response: null,
	Static_Data: (() => ({
		variables: [
			{
				name: "afk",
				aliases: [],
				description: "Use this on a user to see if they are AFK or not.",
				execute: async (context, identifier) => {
					if (!identifier || identifier.toLowerCase() === context.user.Name) {
						return { reply: "Using my advanced quantum processing, I have concluded that you are actually not AFK!" };
					}
	
					const targetUser = await sb.User.get(identifier, true);
					if (!targetUser) {
						return { reply: "That user was not found!" };
					}
					else if (targetUser.Name === context.platform.Self_Name) {
						return { reply: "MrDestructoid I'm never AFK MrDestructoid I'm always watching MrDestructoid" };
					}
	
					const afkData = await sb.Query.getRecordset(rs => rs
						.select("Text", "Started", "Silent", "Status")
						.from("chat_data", "AFK")
						.where("User_Alias = %n", targetUser.ID)
						.where("Active = %b", true)
						.single()
					);
	
					if (!afkData) {
						return {
							reply: "That user is not AFK."
						};
					}
					else {
						const type = (afkData.Status === "afk") ? "" : ` (${afkData.Status})`;
						const foreign = (afkData.Silent) ? "(set via different bot)" : "";
						const delta = sb.Utils.timeDelta(afkData.Started);
						return {
							reply: `That user is currently AFK${type}: ${afkData.Text || "(no message)"} ${foreign} (since ${delta})`
						};
					}
				}
			},
			{
				name: "ambassador",
				aliases: ["ambassadors"],
				description: "Check who is the Supibot ambassador of a channel (or the current one, if none provided).",
				execute: async (context, identifier) => {
					if (!context.channel) {
						return {
							success: false,
							reply: `This command can't be used in whispers!`
						};
					}
	
					const channelData = (identifier)
						? sb.Channel.get(identifier)
						: context.channel;
	
					if (!channelData) {
						return {
							success: false,
							reply: "Provided channel does not exist!"
						};
					}
					else if (!channelData.Data.ambassadors || channelData.Data.ambassadors.length === 0) {
						const prefix = (context.channel === channelData) ? "This" : "Target";
						return {
							reply: `${prefix} channel has no ambassadors.`
						};
					}
	
					const ambassadors = await sb.User.getMultiple(channelData.Data.ambassadors);
					return {
						reply: `Active ambassadors: ${ambassadors.map(i => i.Name)}`
					};
				}
			},
			{
				name: "command-id",
				aliases: ["cid", "CID", "commandid", "commandID"],
				description: "Checks the command execution ID for the current channel.",
				execute: async (context) => {
					const data = await sb.Query.getRecordset(rs => {
						rs.select("Executed", "Execution_Time", "Invocation")
							.from("chat_data", "Command_Execution")
							.where("User_Alias = %n", context.user.ID)
							.where("Platform = %n", context.platform.ID)
							.orderBy("Executed DESC")
							.limit(1)
							.single();
	
						if (context.channel === null) {
							rs.where("Channel IS NULL");
						}
						else {
							rs.where("Channel = %n", context.channel.ID);
						}
	
						return rs;
					});
	
					if (!data) {
						return {
							success: false,
							reply: "You have not executed any commands in this channel before! (except this one)"
						};
					}
					else {
						return {
							reply: `Last used command: ${sb.Command.prefix}${data.Invocation} - Identifier: ${data.Executed.valueOf()} - Execution time: ${data.Execution_Time}ms`
						};
					}
				}
			},
			{
				name: "cookie",
				aliases: [],
				description: "Checks if someone (or you, if not provided) has their fortune cookie available for today.",
				execute: async (context, identifier) => {
					let targetUser = context.user;
					if (identifier) {
						targetUser = await sb.User.get(identifier, true);
					}
	
					if (!targetUser) {
						return {
							success: false,
							reply: "Provided user does not exist!"
						};
					}
					else if (targetUser.Name === context.platform.Self_Name) {
						return {
							reply: "No peeking! 🍪🤖🛡 👀"
						};
					}
	
					const pronoun = (context.user.ID === targetUser.ID) ? "You" : "They";
					const check = await sb.Query.getRecordset(rs => rs
						.select("Cookie_Today", "Cookie_Is_Gifted")
						.from("chat_data", "Extra_User_Data")
						.where("User_Alias = %n", targetUser.ID)
						.single()
					);
	
					let string;
					if (!check) {
						string = pronoun + " have never eaten a cookie before.";
					}
					else if (check.Cookie_Today) {
						string = (check.Cookie_Is_Gifted)
							? pronoun + " have already eaten the daily and gifted cookie today."
							: pronoun + " have already eaten/gifted the daily cookie today.";
	
						const date = new sb.Date().addDays(1);
						date.setUTCHours(0, 0, 0, 0);
	
						string += ` The next cookie will be available in ${sb.Utils.timeDelta(date)}.`;
					}
					else {
						string = (check.Cookie_Is_Gifted)
							? pronoun + " have a gifted cookie waiting."
							: pronoun + " have an unused cookie waiting.";
					}
	
					return {
						reply: string
					};
				}
			},
			{
				name: "error",
				aliases: [],
				description: "If you are marked as a developer, you can check the full text of an error within Supibot, based on its ID.",
				execute: async (context, identifier) => {
					if (!context.user.Data.inspectErrorStacks) {
						return {
							reply: "Sorry, you can't inspect error stacks!"
						};
					}
	
					if (!Number(identifier)) {
						return {
							reply: "Invalid ID provided!"
						};
					}
	
					const row = await sb.Query.getRow("chat_data", "Error");
					try {
						await row.load(Number(identifier));
					}
					catch {
						return {
							reply: "No such error exists!"
						};
					}
	
					const { ID, Stack: stack } = row.values;
	
					const key = { type: "error-paste", ID };
					let link = await this.getCacheData(key);
					if (!link) {
						const result = await sb.Pastebin.post(stack, {
							name: "Stack of Wanductbot (fork of supibot) error ID " + ID,
							expiration: "1H"
						});
						
						if (result.success !== true) {
							return {
								success: false,
								reply: result.error ?? result.body
							};
						}

						link = result.body;
						await this.setCacheData(key, link, {
							expiry: 36e5
						});
					}
	
					if (context.channel) {
						await context.channel.send("The error stack Pastebin link has been whispered to you 💻");
					}
	
					return {
						reply: link,
						replyWithPrivateMessage: true
					}
				}
			},
			{
				name: "reminder",
				aliases: ["reminders"],
				description: "Check the status and info of a reminder created by you or for you.",
				execute: async (context, identifier) => {
					const ID = Number(identifier);
					if (!ID) {
						/** @type Array */
						let reminders = await sb.Query.getRecordset(rs => rs
							.select("ID", "User_From", "User_To", "Private_Message")
							.from("chat_data", "Reminder")
							.where("User_To = %n OR User_From = %n", context.user.ID, context.user.ID)
						)

						if (reminders.length === 0) return { reply: "You have never received or created any reminders!" };

						let nonPrivateReminders = reminders.filter(i => i.Private_Message !== true)
						let privateReminders = reminders.filter(i => i.Private_Message === true)
						let remindersToSelf = nonPrivateReminders.filter(i => i.User_From === i.User_To)
						let remindersCreated = nonPrivateReminders.filter(i => i.User_From === context.user.ID && i.User_From !== i.User_To)
						let remindersReceived = nonPrivateReminders.filter(i => i.User_To === context.user.ID && i.User_From !== i.User_To)

						let remindersFormatted = {
							"Private": `${privateReminders.map(i => i.ID).join(",")}`,
							"To yourself":`${remindersToSelf.map(i => i.ID).join(",")}`,
							"To you": `${remindersReceived.map(i => i.ID).join(",")}`,
							"From you": `${remindersCreated.map(i => i.ID).join(",")}`
						}

						let remindersFormattedText = Object.entries(remindersFormatted)
							.filter(i => i[1] !== "")
							.map(i => `${i[0]}: ${i[1]}`)
							.join("; ")

						let pmMessage = `Your reminders: ${remindersFormattedText}`

						await context.platform.pm(pmMessage, context.user.Name)
						return {
							reply: "I have messaged you a list of all reminders that involve you!"
						};
					}
	
					const reminder = await sb.Query.getRecordset(rs => rs
						.select("ID", "User_From", "User_To", "Text", "Active", "Schedule")
						.from("chat_data", "Reminder")
						.where("ID = %n", ID)
						.single()
					);
	
					if (!reminder) {
						return {
							reply: "That reminder doesn't exist!"
						};
					}
					else if (reminder.User_From !== context.user.ID && reminder.User_To !== context.user.ID) {
						return {
							reply: "That reminder was not created by you or for you. Stop peeking!"
						};
					}
	
					const alreadyFired = (reminder.Active) ? "" : "(inactive)";
					const reminderUser = (context.user.ID === reminder.User_From)
						? await sb.User.get(reminder.User_To, true)
						: await sb.User.get(reminder.User_From, true);
	
					const [owner, target] = (context.user.ID === reminder.User_From)
						? ["Your reminder", "to " + reminderUser.Name]
						: ["Reminder", "by " + reminderUser.Name + " to you"];
	
					const delta = (reminder.Schedule)
						? ` (${sb.Utils.timeDelta(reminder.Schedule)})`
						: "";
	
					return {
						reply: `${owner} ID ${ID} ${target}${delta}: ${reminder.Text} ${alreadyFired}`
					}
				}
			},
			{
				name: "reset",
				aliases: [],
				description: `Checks your last "reset".`,
				execute: async (context) => {
					const last = await sb.Query.getRecordset(rs => rs
						.select("Timestamp")
						.from("data", "Reset")
						.where("User_Alias = %n", context.user.ID)
						.orderBy("ID DESC")
						.limit(1)
						.single()
					);
	
					return {
						reply: (last)
							? `Your last "reset" was ${sb.Utils.timeDelta(last.Timestamp)}.`
							: `You have never noted down a "reset" before.`
					}
				}
			},
			{
				name: "subscription",
				aliases: ["subscriptions", "sub", "subs"],
				description: "Fetches the list of your active event subscriptions within Supibot.",
				execute: async (context) => {
					const types = await sb.Query.getRecordset(rs => rs
						.select("Type")
						.from("data", "Event_Subscription")
						.where("User_Alias = %n", context.user.ID)
						.where("Active = %b", true)
						.orderBy("Type")
						.flat("Type")
					);
	
					if (types.length === 0) {
						return {
							reply: "You're currently not subscribed to any Supibot event."
						};
					}
					else {
						return {
							reply: "You're currently subscribed to these events: " + types.join(", ")
						};
					}
				}
			},
			{
				name: "suggest",
				aliases: ["suggestion", "suggestions"],
				description: "Checks the status and info of a suggestion that you made.",
				execute: async (context, identifier) => {
					if (!identifier) {
						return {
							reply: sb.Utils.tag.trim `
							Check all suggestions:
							https://supinic.com/data/suggestion/list
							||
							Your suggestions:
							https://supinic.com/data/suggestion/list?userName=${context.user.Name}
						`
						};
					}
	
					if (identifier === "last") {
						identifier = await sb.Query.getRecordset(rs => rs
							.select("ID")
							.from("data", "Suggestion")
							.where("User_Alias = %n", context.user.ID)
							.orderBy("ID DESC")
							.limit(1)
							.single()
							.flat("ID")
						);
					}
	
					const row = await sb.Query.getRow("data", "Suggestion");
					try {
						await row.load(Number(identifier));
					}
					catch {
						return { reply: "No such suggestion exists!" };
					}
	
					const {
						ID,
						Date: date,
						Last_Update: update,
						Status: status,
						Text: text,
						User_Alias: user
					} = row.values;
	
					if (status === "Quarantined") {
						return {
							reply: "This suggestion has been quarantined."
						};
					}
	
					const updated = (update)
						? `, last updated ${sb.Utils.timeDelta(update)}`
						: "";
	
					const userData = await sb.User.get(user, true);
					return {
						reply: sb.Utils.tag.trim `
							Suggestion ID ${ID}
							from ${userData.Name}:
							status ${status ?? "Pending review"}
							(posted ${sb.Utils.timeDelta(date)}${updated}):
							${text}
							Detail: ${sb.Command.prefix}check suggestion ${ID}
						`
					};
				}
			},
			{
				name: "timer",
				aliases: [],
				description: "If you have set a timer, this will show its name and date.",
				execute: async (context, identifier) => {
					const { timers } = context.user.Data;
					if (!timers) {
						return {
							success: false,
							reply: `You don't have any timers set up!`
						};
					}
					else if (!timers[identifier]) {
						return {
							success: false,
							reply: `You don't have this timer set up!`
						};
					}
	
					const now = sb.Date.now();
					const date = new sb.Date(timers[identifier].date);
					const delta = sb.Utils.timeDelta(date);
					const verb = (now > date) ? "occured" : "occurs";
	
					return {
						reply: `Your timer "${identifier}" ${verb} ${delta}.`
					};
				}
			},
			{
				name: "twitchlottoblacklist",
				aliases: ["tlbl"],
				description: "If the current channel has a TwitchLotto blacklist setup, this will post it.",
				execute: async (context) => {
					if (!context.channel) {
						return {
							success: false,
							reply: `There are no flags to be found here!`
						};
					}
	
					const { twitchLottoBlacklistedFlags: flags } = context.channel.Data;
					return {
						reply: (!flags || flags.length === 0)
							? `There are currently no blacklisted TL flags in this channel.`
							: `Currently blacklisted flags in this channel: ${flags.join(", ")}`
					};
				}
			}
		]
	})),
	Code: (async function check (context, type, identifier) {
		if (!type) {
			return {
				success: false,
				reply: `No type provided! Check the help: ${sb.Command.prefix}help ${this.Name}`
			};
		}
	
		const item = this.staticData.variables.find(i => i.name === type || i.aliases.includes(type));
		if (!item) {
			return {
				success: false,
				reply: `Invalid type provided! Check the help: ${sb.Command.prefix}help ${this.Name}`
			};
		}
	
		return await item.execute(context, identifier);
	}),
	Dynamic_Description: (async (prefix, values) => {
		const { variables } = values.getStaticData();
		const list = variables.map(i => {
			const aliases = (i.aliases && i.aliases.length > 0)
				? ` (${i.aliases.join(", ")})`
				: "";
	
			return `<li><code>${i.name}${aliases}</code> - ${i.description}</li>`;
		});
	
		return [
			"Checks variables that you have been set within Supibot",
			"",
	
			`<code>${prefix}check (variable)</code>`,
			"Checks the status of a given variable.",
			"",
	
			"Supported types:",
			"<ul>" + list.join("") + "</ul>"
		];
	
	})
};