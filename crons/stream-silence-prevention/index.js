module.exports = {
	Name: "stream-silence-prevention",
	Expression: "*/20 * * * * *",
	Description: "Makes sure that there is not a prolonged period of song request silence on Supinic's stream while live.",
	Defer: null,
	Type: "Bot",
	Code: (async function preventStreamSilence () {
		if (this.data.stopped) {
			return;
		}
	
		const twitch = sb.Platform.get("twitch");
		const cytube = sb.Platform.get("cytube");
		const channelData = sb.Channel.get("supinic", "twitch");
		const streamData = await channelData.getStreamData();
		if (!streamData.live) {
			return;
		}
	
		const state = sb.Config.get("SONG_REQUESTS_STATE");
		if (state !== "vlc" && state !== "cytube") {
			return;
		}
	
		let isQueueEmpty = null;
		if (state === "vlc") {
			const queue = await sb.VideoLANConnector.getNormalizedPlaylist();
			isQueueEmpty = (queue.length === 0);
		}
		else if (state === "cytube") {
			isQueueEmpty = (cytube.controller.playlistData.length === 0);
		}
	
		if (!isQueueEmpty) {
			return;
		}
	
		if (!this.data.videos) {
			// const playlistID = "PL9TsqVDcBIdtyegewA00JC0mlSkoq-VnJ"; // supinic's "stream playlist"
			// const playlistID = "PL9gZzeM4mz7aySWRb0Hsl7Xbp3YCPg88l"; // "TOS Gachi and Cancer music FeelsGoodMan" by TeoTheParty
			const playlistID = "PL9gZzeM4mz7bUF3LXcPRAU-7RFPa6NYqa"; // "Rare Gachi and Cancer HandsUp" by TeoTheParty
			const { result } = await sb.Utils.fetchYoutubePlaylist({
				key: sb.Config.get("API_GOOGLE_YOUTUBE"),
				playlistID
			});
	
			this.data.videos = result.map(i => i.ID);
		}

		let link;
		if (sb.Utils.random(1, 2) === 1) {
			const videoID = sb.Utils.randArray(this.data.videos);
			link = "https://youtu.be/" + videoID;
		}
		else {
			const rg = sb.Command.get("rg");
			const context = sb.Command.createFakeContext(rg);
			const randomResult = await rg.execute(context, "fav:supinic linkOnly:true");
			link = randomResult.link;
		}
	
		let result = "";
		if (state === "vlc") {
			const self = await sb.User.get("supibot");
			const sr = sb.Command.get("sr");

			const fakeContext = { params: {}, user: self, channel: channelData, platform: twitch };
			const commandResult = await sr.execute(fakeContext, link);
			result = commandResult.reply;
		}
		else if (state === "cytube") {
			await cytube.controller.queue("yt", videoID);
			result = `Silence prevention! Successfully added ${link} to Cytube (hopefully).`;
		}
		
		await channelData.send(result);
	})
};