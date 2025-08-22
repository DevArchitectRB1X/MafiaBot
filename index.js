const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// Roluri
const ADMIS_ROLES = ["1407305397404041307", "1367744504706236486"];
const DEMITERE_REMOVE = [
    "1407305397404041307","1367744504706236486","1215035481193189508",
    "1219335537291427952","1208722249549479946","1367744509063987292",
    "1367947879213432894","1153648523204644905","1078634734155997227",
    "784171415552393228","1367745248821907476","784169962952196108",
    "1407424973018103849"
];
const DEMITERE_ADD_ALWAYS = ["809205288057831474"];
const DEMITERE_ADD_ON_OCTIUNE = "1081596297385087056";

const RANK_ROLES = {
  1: ["1367744504706236486"], 
  2: ["1215035481193189508"], 
  3: ["1219335537291427952"], 
  4: ["1208722249549479946"], 
  5: ["1367744509063987292"], 
  6: ["1367745248821907292","1367745248821907293","1407424973018103849","784171415552393228"] // exemplu
};

const TESTER_ROLES = ["784171415552393228", "1407993230808715334"];

// Log
async function sendLog(interaction, action, targetUser, extraInfo = "") {
    const LOG_CHANNEL_ID = "1407998847543676988";
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const executor = interaction.user;
    const target = targetUser ? `${targetUser}` : "N/A";

    await logChannel.send(
        `📝 **Log Administrare**
👤 Executor: ${executor}
🎯 Target: ${target}
⚡ Comanda: /${interaction.commandName}
📌 Actiune: ${action}
ℹ️ Info: ${extraInfo}`
    );
}

// Permisiuni comenzi
const commandRoles = {
  admitere: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
  demitere: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
  aviz: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
  tester: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
  rank: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
};

client.once('ready', () => {
    console.log(`${client.user.tag} este online!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    // verificăm permisiunile
    const allowedRoles = commandRoles[commandName];
    if (allowedRoles) {
        const memberRoles = interaction.member.roles.cache;
        const hasPermission = allowedRoles.some(roleId => memberRoles.has(roleId));
        if (!hasPermission) {
            return interaction.reply({ content: "Nu ai permisiunea de a folosi această comandă.", ephemeral: true });
        }
    }

    // --- Admitere ---
    if (commandName === 'admitere') {
        const member = options.getMember('user');
        const visitorRole = member.guild.roles.cache.get("809205288057831474");
        if (visitorRole && member.roles.cache.has(visitorRole.id)) {
            await member.roles.remove(visitorRole);
        }
        for (const roleId of ADMIS_ROLES) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && !member.roles.cache.has(role.id)) {
                await member.roles.add(role);
            }
        }
        await interaction.reply({ content: `✅ ${member} a fost admis in factiune, felicitari!`, ephemeral: false });
        await sendLog(interaction, "Admitere", member, "Membrul a fost admis cu succes");
    }

    // --- Tester ---
    if (commandName === 'tester') {
        const member = options.getMember('user');
        const visitorRole = member.guild.roles.cache.get("809205288057831474");
        if (visitorRole && member.roles.cache.has(visitorRole.id)) {
            await member.roles.remove(visitorRole);
        }
        for (const roleId of TESTER_ROLES) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && !member.roles.cache.has(role.id)) {
                await member.roles.add(role);
            }
        }
        await interaction.reply({ content: `✅ ${member} este noul tester al factiuni, felicitari!`, ephemeral: false });
        await sendLog(interaction, "Tester", member, "A primit rol de tester");
    }

    // --- Demitere ---
    if (commandName === 'demitere') {
        const member = options.getMember('user');
        const onoare = options.getString('onoare');
        for (const roleId of DEMITERE_REMOVE) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && member.roles.cache.has(role.id)) await member.roles.remove(role);
        }
        for (const roleId of DEMITERE_ADD_ALWAYS) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && !member.roles.cache.has(role.id)) await member.roles.add(role);
        }
        if (onoare === 'onoare') {
            const role = member.guild.roles.cache.get(DEMITERE_ADD_ON_OCTIUNE);
            if (role && !member.roles.cache.has(role.id)) await member.roles.add(role);
            await interaction.reply({ content: `✅ ${member} a fost demis din factiune (cu rol de onoare).`, ephemeral: false });
            await sendLog(interaction, "Demitere", member, "Cu rol de onoare");
        } else {
            await interaction.reply({ content: `✅ ${member} a fost demis din factiune (fara rol de onoare).`, ephemeral: false });
            await sendLog(interaction, "Demitere", member, "Fara rol de onoare");
        }
    }

    // --- Aviz ---
    if (commandName === 'aviz') {
        const user = options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);
        const rolId = '1407424973018103849';
        const logChannelId = '1407989730297249833';
        if (!member.roles.cache.has(rolId)) await member.roles.add(rolId);
        await interaction.reply(`🎉 Felicitari ${user}! Ai luat avizul de contracte.`);
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            await logChannel.send(`📢 ${user} a luat avizul de contracte!`);
            await sendLog(interaction, "Aviz", member, "A primit rolul pentru aviz contracte");
        }
    }

    // --- Rank ---
    if (commandName === "rank") {
        const rankNumber = interaction.options.getInteger("rank");
        const user = interaction.options.getUser("user");
        const member = await interaction.guild.members.fetch(user.id);

        const rolesToGive = RANK_ROLES[rankNumber];
        if (!rolesToGive) return interaction.reply({ content: "❌ Rank invalid!", ephemeral: true });

        try {
            // scoatem TOATE rank-urile existente
            for (const roleList of Object.values(RANK_ROLES)) {
                for (const roleId of Array.isArray(roleList) ? roleList : [roleList]) {
                    if (member.roles.cache.has(roleId)) await member.roles.remove(roleId).catch(() => {});
                }
            }

            // adăugăm doar rolurile pentru rank-ul ales
            for (const roleId of Array.isArray(rolesToGive) ? rolesToGive : [rolesToGive]) {
                await member.roles.add(roleId);
            }

            await interaction.reply({ content: `✅ ${member} a primit **Rank ${rankNumber}**!` });
            await sendLog(interaction, "Rank", member, `I s-a acordat Rank ${rankNumber}`);
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "⚠️ Nu am putut modifica rolurile. Verifică permisiunile botului.", ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
