module.exports = {
	Name: "horoscope",
	Aliases: null,
	Author: "supinic",
	Cooldown: 30000,
	Description: "Checks your horoscope, if you have set your birthday within supibot.",
	Flags: ["mention","non-nullable","pipe"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: (() => ({
		zodiac: [
			{
				name: "Aries",
				start: [3, 21],
				end: [4, 20]
			},
			{
				name: "Taurus",
				start: [4, 21],
				end: [5, 20]
			},
			{
				name: "Gemini",
				start: [5, 21],
				end: [6, 21]
			},
			{
				name: "Cancer",
				start: [6, 22],
				end: [7, 22]
			},
			{
				name: "Leo",
				start: [7, 23],
				end: [8, 22]
			},
			{
				name: "Virgo",
				start: [8, 23],
				end: [9, 21]
			},
			{
				name: "Libra",
				start: [9, 22],
				end: [10, 22]
			},
			{
				name: "Scorpio",
				start: [10, 23],
				end: [11, 22]
			},
			{
				name: "Sagittarius",
				start: [11, 23],
				end: [12, 21]
			},
			{
				name: "Capricorn",
				start: [12, 22],
				end: [1, 20]
			},
			{
				name: "Aquarius",
				start: [1, 21],
				end: [2, 19]
			},
			{
				name: "Pisces",
				start: [2, 20],
				end: [3, 20]
			}
		]
	})),
	Code: (async function horoscope (context) {
		const birthdayData = await context.user.getDataProperty("birthday");
		if (!birthdayData) {
			return {
				success: false,
				reply: `You don't have a birthday set up! Use "${sb.Command.prefix}set birthday (birthday)" command first.`,
				cooldown: { length: 2500 }
			};
		}

		let zodiac = null;
		const { day, month } = birthdayData;
		for (const { start, end, name } of this.staticData.zodiac) {
			if ((month === start[0] && day >= start[1]) || (month === end[0] && day <= end[1])) {
				zodiac = name;
				break;
			}
		}

		if (zodiac === null) {
			return {
				success: false,
				reply: `No zodiac sign detected...?`
			};
		}

		const response = await sb.Got("FakeAgent", {
			url: `https://www.ganeshaspeaks.com/horoscopes/daily-horoscope/${zodiac}`,
			responseType: "text"
		});

		const $ = sb.Utils.cheerio(response.body);
		const node = $("#horo_content");
		if (node.length === 0) {
			return {
				success: false,
				reply: `No horoscope is currently available for this zodiac sign!`
			};
		}
		else if (node.length > 1) {
			return {
				success: false,
				reply: `Received horoscope data is invalid!`
			};
		}

		return {
			reply: `Your horoscope for today: ${node.text()}`
		};
	}),
	Dynamic_Description: null
};
