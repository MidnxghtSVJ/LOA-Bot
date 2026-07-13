const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const LOA_ROLE_ID = "1526363036229832735";

const DATA_FILE = "./loaData.json";

let savedNicknames = {};

if (fs.existsSync(DATA_FILE)) {
    savedNicknames = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(savedNicknames, null, 4)
    );
}


client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});


client.on('guildMemberUpdate', async (oldMember, newMember) => {

    const hadLOA = oldMember.roles.cache.has(LOA_ROLE_ID);
    const hasLOA = newMember.roles.cache.has(LOA_ROLE_ID);


    // LOA role added
    if (!hadLOA && hasLOA) {

        const oldNickname = newMember.nickname || newMember.user.username;

        console.log(`Saving nickname: ${oldNickname}`);

        savedNicknames[newMember.id] = oldNickname;
        saveData();

        try {
            await newMember.setNickname(`[LOA] ${oldNickname}`);

            console.log(`${newMember.user.tag} is now on LOA`);

        } catch (error) {
            console.log("Could not change nickname:", error);
        }
    }


    // LOA role removed
    if (hadLOA && !hasLOA) {

        const oldNickname = savedNicknames[newMember.id];

        if (oldNickname) {

            try {
                await newMember.setNickname(oldNickname);

                delete savedNicknames[newMember.id];
                saveData();

                console.log(`${newMember.user.tag} returned from LOA`);

            } catch (error) {
                console.log("Could not restore nickname:", error);
            }
        }
    }

});

client.login(process.env.TOKEN);