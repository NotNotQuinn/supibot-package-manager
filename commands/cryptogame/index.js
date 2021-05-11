module.exports = {
    Name: "cryptogame",
    Aliases: ["cg"],
    Author: "supinic",
    Cooldown: 5000,
    Description: "Tell people this command is not availble.",
    Flags: ["non-nullable","pipe"],
    Params: null,
    Whitelist_Response: null,
    Static_Data: null,
    Code: (async function cg () {
        return {
            reply: "Cryptogame command is not availible because it is heavily database integrated, and I have no intention of adding it :)"
        }
    }),
    Dynamic_Description: null
};