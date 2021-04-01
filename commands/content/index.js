module.exports = {
	Name: "content",
	Aliases: null,
	Author: "supinic",
	Cooldown: 30000,
	Description: "Shows how many suggestions there are Uncategorized and New - basically showing how much content I have for the next stream.",
	Flags: ["mention","pipe"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: null,
	Code: (async function content () {
		const data = await sb.Query.getRecordset(rs => rs
			.select("Category", "Status", "User_Alias")
			.from("data", "Suggestion")
			.where("Status IS NULL OR Status = %s", "Approved")
		);
	
		const count = {
			approved: 0,
			botRequest: 0,
			new: 0
		};
	
		for (const item of data) {
			if (item.Category === null && item.Status === null) {
				count.new++
			}
			else if (item.Category === "Bot addition") {
				count.botRequest++;
			}
			else {
				count.approved++;
			}
		}
	
		return {
			reply: sb.Utils.tag.trim `
				Content status: 
				${count.new} new suggestions,				
				${count.approved} approved suggestions,
				${count.new + count.approved} total.				
				${count.botRequest} bot requests.
			`
		};
	}),
	Dynamic_Description: null
};