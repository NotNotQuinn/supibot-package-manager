module.exports = {
	Name: "ping",
	Aliases: ["pang","peng","pong","pung","pyng"],
	Author: "supinic",
	Cooldown: 5000,
	Description: "Ping!",
	Flags: ["pipe","skip-banphrase"],
	Params: null,
	Whitelist_Response: null,
	Static_Data: (() => {
		require("loadavg-windows");
		return {
			checkLatency: async (callback, ...args) => {
				try {
					const start = process.hrtime.bigint();
					await callback(...args);

					return sb.Utils.round(Number(process.hrtime.bigint() - start) / 1.0e6, 3);
				}
				catch {
					return null;
				}
			}
		}
	}),
	Code: (async function ping (context) {
		const getLoadAverages = require("os").loadavg;
		const chars = {a: "e", e: "i", i: "o", o: "u", u: "y", y: "a"};
		const si = require("systeminformation")
		const mem = await si.mem()
		const pong = "P" + chars[context.invocation[1]] + "ng!";
	
		// const [swapTotal, swapFree] = memoryData.slice(14, 16);
		// const swapUsed = (swapTotal - swapFree);
	
		const [min1, min5] = getLoadAverages();
		const loadRatio = (min1 / min5);
		const loadDelta = Math.abs(1 - loadRatio);
		const loadDirection = (loadRatio > 1) ? "rising" : (loadRatio < 1) ? "falling" : "steady";
		const loadChange = (loadDelta > 0.10) ? " sharply" : (loadDelta > 0) ? " steadily" : "";

		const uptime = sb.Runtime?.started ?? new sb.Date().addSeconds(-process.uptime());
		const data = {
			Uptime: sb.Utils.timeDelta(uptime).replace("ago", "").trim(),
			// Temperature: temperature.stdout.match(/([\d.]+)/)[1] + "°C",
			"Free memory": sb.Utils.formatByteSize(mem.free, 0) + "/" + sb.Utils.formatByteSize(mem.total, 0),
			"CPU usage": (min5 === 0)
				? "No stats available"
				: `${loadDirection}${loadChange}`,
			// Swap: sb.Utils.formatByteSize(swapUsed, 0) + "/" + sb.Utils.formatByteSize(swapTotal, 0),
			"Commands used": await sb.Runtime.commands
		};
	
		if (sb.Cache) {
			data.Redis = (sb.Cache.active)
				? String(await sb.Cache.server.dbsize()) + " keys"
				: "not online"
		}
	
		if (context.channel) {
			const type = context.channel.Banphrase_API_Type;
			const url = context.channel.Banphrase_API_URL;
	
			if (type && url) {
				const ping = await this.staticData.checkLatency(
					async () => sb.Banphrase.executeExternalAPI("test", type, url)
				);
	
				const result = (ping === null)
					? "No response from API"
					: `${Math.trunc(ping)}ms`;
	
				data["Banphrase API"] = `Using ${type} API: ${url} (${result})`;
			}
			else {
				data["Banphrase API"] = "Not connected";
			}
		}
	
		if (context.platform.Name === "twitch") {
			let ping = await this.staticData.checkLatency(
				async () => context.platform.client.ping()
			);
			ping = Math.trunc(ping);

			let suffix = "";
			if (context.channel.Name == "supinic") {
				/** @type {string} */
				let supibotLatency = sb?.ChatModule?.get("save-supibot-ping")?.data?.supibot_latency;
	
				if (supibotLatency && supibotLatency - ping > 0) {
					suffix = ` [${supibotLatency - ping}ms faster than supibot.]`
				}
			}

			data["Latency to TMI"] = (ping === null)
				? "No response from Twitch (?)"
				: `${ping}ms${suffix}`;
		}
	
		return {
			reply: pong + " " + Object.entries(data).map(([name, value]) => name + ": " + value).join("; ")
		};
	}),
	Dynamic_Description: (async (prefix) => {
		return [
			"Pings the bot, checking if it's alive, and a bunch of other data, like latency and commands used this session",
			"",
	
			`<code>${prefix}ping</code>`,
			"Pong! Latency: ..., Commands used: ..."
		];
	})
};