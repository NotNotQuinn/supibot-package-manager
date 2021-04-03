module.exports = {
    Name: "chat-suggestion-linker",
    Events: ["message"],
    Description: "If a Wanductbot suggestion ID format is detected, posts how to check it - plus a github link, if the suggestion has one.",
    Code: (async function liveDetection (context) {
        const { channel, message } = context;
        const match = message.match(/W#(\d+)/i);
        if (!match) {
            return;
        }

        const ID = Number(match[1]);
        if (!sb.Utils.isValidInteger(ID)) {
            return;
        }

        const data = await sb.Query.getRecordset(rs => rs
            .select("ID", "Github_Link")
            .from("data", "Suggestion")
            .where("ID = %n", ID)
            .single()
        );

        const now = sb.Date.now();
        if (!data) {
            return;
        }
        else if (this.data.timeout && this.data.timeout >= now) {
            return;
        }

        const siteLink = `'${sb.Command.prefix}check suggestion ${ID}'`;
        const githubLink = (data.Github_Link)
            ? `https:${data.Github_Link}`
            : "";

        if (!githubLink) {
            return;
        }

        await channel.send(`W#${ID}: ${siteLink} ${githubLink}`);

        this.data.timeout = now + 5000;
    }),
    Author: "supinic"
};