const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});


// ================= SETTINGS =================

// LOA role
const LOA_ROLE_ID = "1526363036229832735";


// Roles removed while on LOA
// Add your management/access roles here
const REMOVABLE_ROLES = [
    "1526347305039433889",
    "1526346933642330244"
];


// Data file
const DATA_FILE = "./loaData.json";


// ============================================


// Load saved data
let savedData = {};

if (fs.existsSync(DATA_FILE)) {
    savedData = JSON.parse(fs.readFileSync(DATA_FILE));
}


function saveData() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(savedData, null, 4)
    );
}


client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});



client.on('guildMemberUpdate', async (oldMember, newMember) => {

    const hadLOA = oldMember.roles.cache.has(LOA_ROLE_ID);
    const hasLOA = newMember.roles.cache.has(LOA_ROLE_ID);



    // ============================
    // LOA ADDED
    // ============================

    if (!hadLOA && hasLOA) {

        const oldNickname =
            newMember.nickname ||
            newMember.user.username;


        const removedRoles = [];


        // Save and remove access roles
        for (const roleId of REMOVABLE_ROLES) {

            if (newMember.roles.cache.has(roleId)) {

                removedRoles.push(roleId);

                try {
                    await newMember.roles.remove(roleId);
                }
                catch (error) {
                    console.log(
                        `Could not remove role ${roleId}:`,
                        error.message
                    );
                }
            }
        }



        // Save data
        savedData[newMember.id] = {
            nickname: oldNickname,
            roles: removedRoles
        };

        saveData();



        // Change nickname
        try {

            await newMember.setNickname(
                `[LOA] ${oldNickname}`
            );

            console.log(
                `${newMember.user.tag} is now on LOA`
            );

        }
        catch (error) {

            console.log(
                "Could not change nickname:",
                error.message
            );
        }
    }




    // ============================
    // LOA REMOVED
    // ============================

    if (hadLOA && !hasLOA) {


        const data = savedData[newMember.id];


        if (!data) {
            console.log(
                "No saved LOA data found"
            );
            return;
        }



        // Restore nickname
        try {

            await newMember.setNickname(
                data.nickname
            );

        }
        catch (error) {

            console.log(
                "Could not restore nickname:",
                error.message
            );
        }



        // Restore roles
        for (const roleId of data.roles) {

            try {

                await newMember.roles.add(roleId);

            }
            catch (error) {

                console.log(
                    `Could not restore role ${roleId}:`,
                    error.message
                );
            }
        }



        delete savedData[newMember.id];
        saveData();



        console.log(
            `${newMember.user.tag} returned from LOA`
        );
    }

});

client.login(process.env.TOKEN);

