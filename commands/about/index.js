module.exports = {
	Name: "about",
	Aliases: null,
	Author: "supinic",
	Cooldown: 60000,
	Description: "Posts a summary of what supibot does, and what it is.",
	Flags: ["mention","pipe"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function about () {
		return {	
			reply: "Wanductbot is a smol variety and utility bot forked from supibot! Not primarily designed for moderation MrDestructoid running on Node.js since Mar 2021."
		};
	}),
	Dynamic_Description: null
};