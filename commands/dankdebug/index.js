module.exports = {
	Name: "dankdebug",
	Aliases: ["js"],
	Author: "supinic",
	Cooldown: 10000,
	Description: "Debug command for public use, which means it's quite limited because of security.",
	Flags: ["external-input","developer","mention","pipe","use-params"],
	Params: [
		{ name: "arguments", type: "string" },
		{ name: "errorInfo", type: "boolean" },
		{ name: "force", type: "boolean" },
		{ name: "function", type: "string" },
		{ name: "importGist", type: "string" }
	],
	Whitelist_Response: null,
	Static_Data: (() => ({
		customDataLimit: 1_000_000
	})),
	Code: (async function dankDebug (context, ...args) {
		let scriptArgs;
		if (context.params.arguments) {
			if (context.params.function) {
				return {
					success: false,
					reply: `Cannot combine arguments and function params together!`
				};
			}

			try {
				scriptArgs = JSON.parse(context.params.arguments);
			}
			catch (e) {
				return {
					success: false,
					reply: `Command arguments cannot be parsed! ${e.message}`
				};
			}
		}

		let importedText;
		if (context.params.importGist) {
			if (context.params.importGist.includes(" ")) {
				return {
					success: false,
					reply: `Gist IDs cannot contain spaces!`
				};
			}

			const gistCommand = sb.Command.get("pastebin");
			const fakeCtx = sb.Command.createFakeContext(
				gistCommand,
				{
					...context,
					params: {
						force: Boolean(context.params.force)
					},
					invocation: "gist"
				},
				{}
			);

			const gistResult = await gistCommand.execute(fakeCtx, context.params.importGist);
			if (gistResult.success === false) {
				return gistResult;
			}

			importedText = gistResult.reply;

			if (!importedText.endsWith(";") && !importedText.endsWith(",")) {
				importedText += ";";
			}
		}

		let result;
		let script;
		const string = args.join(" ");

		if (context.params.function) {
			script = context.params.function;
			scriptArgs = [...args];
		}
		else if (!string.includes("return")) {
			script = string;
		}
		else {
			script = `(async () => {\n${string}\n})()`;
		}

		if (importedText) {
			script = `${importedText}\n${script}`;
		}

		const createSandbox = require("./create-sandbox");
		const sandboxData = await createSandbox(context, scriptArgs);

		const scriptContext = {
			fixAsync: false,
			sandbox: sandboxData.sandbox
		};
		try {
			result = await sb.Sandbox.run(script, scriptContext);
		}
		catch (e) {
			if (!(e instanceof Error)) {
				return {
					success: false,
					reply: `Your dank debug threw or rejected with a non-Error value!`
				};
			}

			const { name } = e.constructor;
			if (name === "EvalError") {
				return {
					success: false,
					reply: "Your dank debug contains code that isn't allowed!"
				};
			}

			if (context.params.errorInfo) {
				const stack = e.stack.split(/\r?\n/);
				const lastLine = stack.findIndex(i => i.includes("Script.runInContext"));
				const text = JSON.stringify({
					script,
					stack: stack.slice(0, lastLine)
				}, null, 4);

				const paste = await sb.Pastebin.post(text, {
					name: "Full error info for $js",
					expiration: "1H",
					format: "json"
				});

				const link = (paste.success) ? paste.body : paste.error;
				return {
					success: false,
					reply: `${e.toString()} - More info: ${link}`
				};
			}

			return {
				success: false,
				reply: e.toString()
			};
		}

		const channelDataResult = await sandboxData.handleChannelDataChange(this.staticData.limit);
		if (channelDataResult.success === false) {
			return channelDataResult;
		}

		const userDataResult = await sandboxData.handleUserDataChange(this.staticData.limit);
		if (userDataResult.success === false) {
			return channelDataResult;
		}

		if (result && typeof result === "object") {
			try {
				if (typeof result.toJSON === "function") {
					return {
						reply: String(result.toJSON())
					};
				}

				return {
					reply: require("util").inspect(result)
				};
			}
			catch (e) {
				console.warn(e);
				return {
					success: false,
					reply: "Your dank debug's return value cannot be serialized!"
				};
			}
		}
		else {
			return {
				cooldown: (context.append.pipe) ? null : this.Cooldown,
				reply: String(result)
			};
		}
	}),
	Dynamic_Description: (async (prefix) => [
		"Debug command for public use, which means it's quite limited because of security.",
		"This description assumes you already know JavaScript. A brief overview of how the command works.",
		"For an extensive look at all of the variables and methods available within the dankdebug context, see <a href=\"//github.com/supinic/supibot-package-manager/tree/master/commands/dankdebug/\">these files</a>.",
		"",

		`<code>${prefix}js (your code here)</code>`,
		"Runs your code, and replies with the result value. If there is no return, the last statement's value is used, e.g.:",
		`<code>${prefix}js 0x100 * 2</code> => <code>512</code>`,
		`<code>${prefix}js let array = [ 'foo', 'bar', 'baz' ]; array.pop()</code> => <code>baz</code>`,
		"Note: If your code contains <code>return</code> <em>anywhere</em>, it will be wrapped in an async function, e.g.:",
		`<code>${prefix}js return 0x100 * 2</code> => <code>512</code>`,
		`<code>${prefix}js let array = [ 'foo', 'bar', 'baz' ]; return array.pop()</code> => <code>baz</code>`,
		`<code>${prefix}js let array = [ 'foo', 'foo_return_bar', 'baz' ]; array.pop()</code> => <code>undefined</code>`,
		`<code>${prefix}js let array = [ 'foo', 'foo_return_bar', 'baz' ]; return array.pop()</code> => <code>baz</code>`,
		"",

		`<code>${prefix}js errorInfo:true (your code here)</code>`,
		"Runs your code as normal, but if there is an error, it will post a link to where you can view the entire call stack and script and the command fails, e.g.:"
		`<code>${prefix}js errorInfo:true throw new Error('Critical error!')</code> => <code>Error: Critical error! - More info: &lt;link&gt;</code>`,
		"If there is an error without <code>errorInfo:true</code> provided, only the error message is provided back and the command fails.",
		`<code>${prefix}js throw new Error('Critical error!')</code> => <code>Error: Critical error!</code>`,
		"",

		`<code>${prefix}js function:"(your code here)"</code>`,
		"Runs the code inside the function parameter, without ever wrapping your code inside any function.",
		"When the command in invoked in this way the <code>args</code> variable set to a string array of the input, e.g.:",
		`<code>${prefix}js function:args foo bar baz</code> => <code>[ 'foo', 'bar', 'baz' ]</code>`,
		`<code>${prefix}js function:"let len = args.length; len"</code> => <code>0</code>`,
		"",

		`<code>${prefix}js arguments:"(your JSON here)"</code>`,
		// TODO
		"",

		`<code>${prefix}js importGist:(your gist id here)</code>`,
		`<code>${prefix}js importGist:(your gist id here) force:true</code>`,
		// TODO
		"",

	])
};
