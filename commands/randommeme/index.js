module.exports = {
	Name: "randommeme",
	Aliases: ["rm"],
	Author: "supinic",
	Cooldown: 15000,
	Description: "If no parameters are provided, posts a random reddit meme. If you provide a subreddit, a post will be chosen randomly. NSFW subreddits and posts are only available on NSFW Discord channels!",
	Flags: ["mention","non-nullable","pipe","use-params"],
	Params: [
		{ name: "comments", type: "boolean" },
		{ name: "linkOnly", type: "boolean" }
	],
	Whitelist_Response: null,
	Static_Data: (() => {
		const expiration = 3_600_000; // 1 hour
		this.data.subreddits = {};
	
		class Subreddit {
			#name;
			#error = null;
			#errorMessage = null;
			#exists = false;
			#reason = null;
			#quarantine = null;
			#nsfw = null;
			#expiration = -Infinity;
			posts = [];
			repeatedPosts = [];
	
			constructor (meta) {
				this.#errorMessage = meta.message ?? null;
				this.#error = meta.error ?? null;
				this.#reason = meta.reason ?? null;
	
				if (meta.data && typeof meta.data.dist === "undefined") {
					const { data } = meta;
					this.#name = data.display_name;
					this.#exists = (!data.children || data.children !== 0);
					this.#quarantine = Boolean(data.quarantine);
					this.#nsfw = Boolean(data.over_18);
				}
				else {
					this.#exists = false;
					this.#expiration = Infinity;
				}
			}
	
			setExpiration () {
				this.#expiration = new sb.Date().addMilliseconds(expiration);
			}
	
			get expiration () { return this.#expiration; }
			get error () { return this.#error; }
			get exists () { return this.#exists; }
			get name () { return this.#name; }
			get nsfw () { return this.#nsfw; }
			get quarantine () { return this.#quarantine; }
			get reason () { return this.#reason; }
		}
	
		class RedditPost {
			#author;
			#created;
			#id;
			#title;
			#url;
			#commentsUrl;
	
			#crosspostOrigin = null;
			#isTextPost = false;
			#nsfw = false;
			#stickied = false;
	
			#score = 0;
	
			constructor (data) {
				let crossPostNSFW = false;
				if (data.crosspost_parent_list && data.crosspost_parent_list.length > 0) {
					crossPostNSFW = crossPostNSFW || data.over_18;
					data = data.crosspost_parent_list.pop();
					this.#crosspostOrigin = data.subreddit_name_prefixed;
				}
	
				this.#author = data.author;
				this.#created = new sb.Date(data.created_utc * 1000);
				this.#id = data.id;
				this.#title = data.title;
				this.#url = data.url;
				this.#commentsUrl = `r/${data.subreddit}/comments/${data.id}`;

				this.#isTextPost = Boolean(data.selftext && data.selftext_html);
				this.#nsfw = Boolean(data.over_18) || crossPostNSFW;
				this.#stickied = Boolean(data.stickied);
	
				this.#score = data.ups ?? 0;
			}
	
			get id () { return this.#id; }
			get nsfw () { return this.#nsfw; }
			get stickied () { return this.#stickied; }
			get isTextPost () { return this.#isTextPost; }
			get url () { return this.#url; }
			get commentsUrl () { return this.#commentsUrl; }
	
			get posted () {
				return sb.Utils.timeDelta(this.#created);
			}
	
			toString () {
				const xpost = (this.#crosspostOrigin)
					? `, x-posted from ${this.#crosspostOrigin}`
					: "";
	
				return `${this.#title} ${this.#url} (Score: ${this.#score}, posted ${this.posted}${xpost})`;
			}
		}
	
		return {
			repeats: 10,
			expiration,
			RedditPost,
			Subreddit,
	
			uncached: [
				"random"
			],
			banned: [
				"bigpenis",
				"cockcourt",
				"cosplaygirls",
				"moobs",
				"fatasses",
				"feetpics",
				"foot",
				"instagrammodels",
				"russianbabes"
			],
			defaultMemeSubreddits: [
				"okbuddyretard",
				"memes",
				"dankmemes",
				"pewdiepiesubmissions"
			]
		};
	}),
	Code: (async function randomMeme (context, ...args) {
		let safeSpace = false;
		if (context.platform.Name === "twitch") {
			safeSpace = true;
		}
		else if (!context.channel?.NSFW && !context.privateMessage) {
			safeSpace = true;
		}
	
		const input = (args.shift() ?? sb.Utils.randArray(this.staticData.defaultMemeSubreddits));
		const subreddit = encodeURIComponent(input.toLowerCase());
	
		let forum = this.data.subreddits[subreddit];
		if (!forum) {
			const { statusCode, body: response } = await sb.Got("Reddit", subreddit + "/about.json");
	
			if (statusCode !== 200 && statusCode !== 403 && statusCode !== 404) {
				throw new sb.errors.APIError({
					statusCode,
					apiName: "RedditAPI"
				});
			}
	
			forum = new this.staticData.Subreddit(response);
			if (!this.staticData.uncached.includes(subreddit)) {
				this.data.subreddits[subreddit] = forum;
			}
		}
	
		if (forum.error) {
			return {
				success: false,
				reply: `That subreddit is ${forum.reason ?? "not available"}!`
			};
		}
		else if (!forum.exists) {
			return {
				success: false,
				reply: "That subreddit does not exist!"
			};
		}
		else if (safeSpace && (this.staticData.banned.includes(forum.name) || forum.nsfw)) {
			return {
				success: false,
				reply: "That subreddit is flagged as 18+, and thus not safe to post here!"
			};
		}
	
		if (forum.posts.length === 0 || sb.Date.now() > forum.expiration) {
			const { statusCode, body: response } = await sb.Got("Reddit", subreddit + "/hot.json");
			if (statusCode !== 200) {
				throw new sb.errors.APIError({
					statusCode,
					apiName: "RedditAPI"
				})
			}
	
			forum.setExpiration();
			forum.posts = response.data.children.map(i => new this.staticData.RedditPost(i.data));
		}
	
		const { posts, repeatedPosts } = forum;
		const validPosts = posts.filter(i => (
			(!safeSpace || !i.nsfw)
			&& !i.stickied
			&& !i.isSelftext
			&& !i.isTextPost
			&& !repeatedPosts.includes(i.id)
		));
	
		const post = sb.Utils.randArray(validPosts);
		if (!post) {
			return {
				success: false,
				reply: "No suitable posts found!"
			}
		}
		else {
			if ((this.staticData.banned.includes(forum.name) || post.nsfw) && context.append.pipe) {
				return {
					success: false,
					reason: "pipe-nsfw"
				};
			}
	
			// Add the currently used post ID at the beginning of the array
			repeatedPosts.unshift(post.id);
			// And then splice off everything over the length of 3.
			repeatedPosts.splice(this.staticData.repeats);

			if (context.params.linkOnly) {
				return {
					reply: post.url
				};
			}

			const commentsUrl = (context.params.comments)
				? `Thread: https://reddit.com/${post.commentsUrl}`
				: "";

			const symbol = (forum.quarantine) ? "⚠" : "";
			return {
				reply: sb.Utils.fixHTML(`${symbol} ${post.toString()} ${commentsUrl}`)
			};
		}
	}),
	Dynamic_Description: (async (prefix, values) => {
		const { defaultMemeSubreddits } = values.getStaticData();

		return [
			"Posts a random Reddit meme. If a subreddit is provided, posts a random non-text post from there.",
			"",

			`<code>${prefix}rm</code>`,
			`<code>${prefix}randommeme</code>`,
			"Posts a random post from one of the default meme subreddits.",
			`<code>${defaultMemeSubreddits.join(" ")}</code>`,
			"",

			`<code>${prefix}rm (subreddit)</code>`,
			`<code>${prefix}randommeme (subreddit)</code>`,
			"Posts a random post from the specified subreddit.",
			"NSFW-marked subreddits are not available outside of channels marked for that content.",
			"NSFW-marked posts will be filtered out in channels not marked for that content.",
			"",

			`<code>${prefix}rm linkOnly:true</code>`,
			`<code>${prefix}rm (subreddit) linkOnly:true</code>`,
			"Posts a random post from the default, or specified subreddit, posting just the link without any other text.",
		];
	})
};