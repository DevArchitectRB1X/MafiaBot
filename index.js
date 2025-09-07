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
const { EmbedBuilder } = require('discord.js');
const intrebaritester = [
"Care sunt cerintele pentru Mafia Ruseasca?",
"Se acorda un rank special daca primesti functia de tester?",
"Ca si tester ai raport special?",
"Cate intrebari trebuie sa contina testul teoretic de intrare in factiune?",
"Ce trebuie sa faci la fiecare test de intrare in factiune?",
"Cu ce se sanctioneaza tentativa de fraudare test?",
"Ce punctaj se ofera la o intrebare gresita?",
"Ce punctaje pot exista la un test?",
"Se poate acorda 0.25 la o intrebare partial gresita?",
"Spune minim 5 comenzi ale factiunii si ce fac acestea.",
"Ce activitati desfasoara Mafia Ruseasca?",
"Ce inseamna traficul de droguri?",
"Ce inseamna traficul de armament?",
"Ai voie sa faci trafic de armament off duty? Daca nu, cu ce se sanctioneaza?",
"In ce interval de ore poti rapi un jucator?",
"Ce level trebuie sa aiba un jucator ca sa il rapesti?",
"Cand se poate rapiri Politistii/Jandarmii/Militarii on duty?",
"Ai voie sa rapesti mecanici duty?",
"Spune 5 locatii unde se interzice rapirea unui jucator.",
"La ce HQ ai voie sa rapesti persoane?",
"Dupa cat timp se poate rapi un jucator din nou?",
"Care este suma maxima de bani care poti cere la un jucator?",
"Ai voie dupa ucidere sa mergi dupa jucatorul omorat sa ii ceri bani?",
"Ce poti face cu jucatorul rapit?",
"Cu ce masini nu ai voie sa rapesti?",
"Cand pot deschide focul de arma asupra unui jucator?",
"Ce faci dupa ce i-ai dat 3 somatii, iar acesta nu a urcat?",
"Ai voie cu masina persoana la raid-uri, daca nu cu ce se sanctioneaza?",
"Ai voie sa faci drive by asupra membrilor MApN la raid? Daca nu, ce sanctiune primesti?",
"Ai voie sa ucizi civili care te incurca sau se afla in curtea MApN?"
];

const intrebariadmitere = [
  { intrebare: "Spune minim 5 comenzi ale factiunii si ce fac acestea.", raspuns: "[/f], [/svf], [/dsvf], [/tie], [/som], etc." },
  { intrebare: "Ce activitati desfasoara Mafia Ruseasca?", raspuns: "Trafic de droguri, trafic de arme, traficul/rapirea jucatorilor si jafuri" },
  { intrebare: "Ce inseamna traficul de droguri?", raspuns: "Traficul de droguri inseamna vanzarea drogurilor la jucatori" },
  { intrebare: "Ce inseamna traficul de armament?", raspuns: "Traficul de armament inseamna transporturl de materiale" },
  { intrebare: "Ai voie sa faci trafic de armament off duty? Daca nu, cu ce se sanctioneaza?", raspuns: "Traficul de armament off duty se sanctioneaza cu FW" },
  { intrebare: "In ce interval de ore poti rapi un jucator?", raspuns: "Se poate rapi un jucator in intervalul 18:00-8:00" },
  { intrebare: "Ce level trebuie sa aiba un jucator ca sa il rapesti?", raspuns: "Minim level 10" },
  { intrebare: "Cand nu se poate rapiri Politistii/Jandarmii/Militarii on duty(Minim 3 situatii)?", raspuns: "Cand acestia nu sunt la incendii, interventii, cand dau amenzi, când fac vama, cand se ocupa de dirijarea traficului, cand au sirenele pornite." },
  { intrebare: "Ai voie sa rapesti mecanici duty?", raspuns: "Nu, nu ai voie" },
  { intrebare: "Spune 5 locatii unde se interzice rapirea unui jucator.", raspuns: "Dealership, Hotel, banci, benzinarii, vama, etc." },
  { intrebare: "La ce HQ ai voie sa rapesti persoane?", raspuns: "La HQ-ul Mafiei Ruse" },
  { intrebare: "Dupa cat timp se poate rapi un jucator din nou?", raspuns: "Se poate rapi un jucator din nou dupa 6 ore" },
  { intrebare: "Care este suma maxima de bani care poti cere la un jucator?", raspuns: "Se poate cere suma maxima de 1kk(1.000.000)" },
  { intrebare: "Ai voie dupa ucidere sa mergi dupa jucatorul omorat sa ii ceri bani?", raspuns: "Nu, nu ai voie" },
  { intrebare: "Ce poti face cu jucatorul rapit?", raspuns: "Jefuirea jucatorului rapit, il poti ucide, ii poti fura organele, il pui sa sune la politie solicind rascumparare" },
  { intrebare: "Cu ce masini nu ai voie sa rapesti?", raspuns: "Elicopterul, Mercedes Vito si Volkwagen Transporter" },
  { intrebare: "Cand pot deschide focul de arma asupra unui jucator?", raspuns: "Dupa cele 3 somatii" },
  { intrebare: "Ce licenta e obligatorie pentru rapiri?", raspuns: "Este obligatorie licenta de gun" },
  { intrebare: "Ai voie cu masina persoana la raid-uri, daca nu cu ce se sanctioneaza?", raspuns: "Nu, nu ai voie si se sanctioneaza cu FW" },
  { intrebare: "Ai voie sa faci drive by asupra membrilor MApN la raid? Daca nu, ce sanctiune primesti?", raspuns: "Nu, nu ai voie si se sanctioneaza cu AV" },
  { intrebare: "Ai voie sa ucizi civili care te incurca sau se afla in curtea MApN?", raspuns: "Da, ai voie" },
  { intrebare: "Cand se face raid?", raspuns: "In fiecare zi intre orele 20:00-22:00 (daca inca nu sa modificat atunci in fiecare luni, miercuri si vineri intre orele 20:00-22:00)" },
  { intrebare: "Ai voie cu masina personala la raid?", raspuns: "Nu, nu ai voie" },
  { intrebare: "Ce limbaj ai voie sa folosesti la o rapire?", raspuns: "Un limbaj agresiv si putin vulgar, fara sa se ia de persoana reala" },
  { intrebare: "Cum te pui on duty la mafie?", raspuns: "Folosind comanda [/getskin] in HQ" },
  { intrebare: "Ai voie sa rapesti personalul SMURD/SJA?", raspuns: "Nu, nu ai voie" },
  { intrebare: "Cand ai voie sa folosesti cutitul la o rapire?", raspuns: "Atunci cand decapitezi persoana" },
  { intrebare: "Cu ce comanda legi o persoana in masina?", raspuns: "Folosind comanda [/tie]" },
  { intrebare: "Daca ai jefuit un jucator rapit, mai ai voie sa suni la politie pentru rascumparare?", raspuns: "Nu, nu mai ai voie" },
  { intrebare: "Ce se intampla daca un jucator da /call 112 unui mafiot in timp ce este rapit?", raspuns: "Primeste blacklist la factiune" },
  { intrebare: "Cand ai voie sa rapesti un jucator care face job?", raspuns: "Niciodata, insa se poate rapi doar cand face job-ul de pescar(pentru ca niciodata nu sti daca face sau nu)" },
  { intrebare: "Unde nu ai voie sa vinzi droguri?", raspuns: "Ai voie sa vinzi oriunde droguri, numai sa nu fi prins" }
];

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
  6: ["784169962952196108"] // exemplu
};

const TESTER_ROLES = ["784171415552393228", "1407993230808715334"];

// Funcție pentru a alege n întrebări random fără duplicat
function selectRandomIntrebariTester(array, n) {
  const copy = [...array]; // facem o copie ca să nu modificăm originalul
  const result = [];
  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * copy.length);
    result.push(copy[randomIndex]);
    copy.splice(randomIndex, 1); // eliminăm pentru a nu se repeta
  }
  return result;
}

async function sendLog(interaction, action, targetUser, extraInfo = "") {
    const LOG_CHANNEL_ID = "1407998847543676988";
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    // Executor (cel care folosește comanda)
    const executorMember = interaction.member;
    const executorNickname = executorMember.nickname || executorMember.user.username;
    const executorFull = `${executorNickname} (${executorMember.user.tag})`;

    // Target (cel asupra căruia se aplică comanda)
    let targetFull = "N/A";
    if (targetUser) {
        const member = interaction.guild.members.cache.get(targetUser.id);
        if (member) {
            const targetNickname = member.nickname || member.user.username;
            targetFull = `${targetNickname} (${member.user.tag})`;
        } else {
            targetFull = `${targetUser.username} (${targetUser.tag})`; // fallback dacă nu e în cache
        }
    }

    await logChannel.send(
        `📝 **Log Administrare**
👤 Executor: ${executorFull}
🎯 Tinta: ${targetFull}
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
    fw: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
    testtester: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
    ms: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"],
	testadmitere: ["784171414281781308","1367898142007103641","784169962952196108","1367745248821907476"]
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

    if (interaction.commandName === 'ms') {
      const user = interaction.options.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);

      const transporturi = interaction.options.getInteger('transporturi');
      const rapiri = interaction.options.getInteger('rapiri');
      const contracte = interaction.options.getInteger('contracte');
      const drugs = interaction.options.getInteger('drugs');
      const mats = interaction.options.getInteger('mats');

      const rezultat = transporturi + (rapiri * 5) + (contracte * 5);

      // Construim mesajul
      let msg = `${member ? member.displayName : user.username} - ${transporturi} transporturi`;
      if (rapiri > 0) msg += ` - ${rapiri} rapiri`;
      if (contracte > 0) msg += ` - ${contracte} contracte`;
      if (drugs > 0) msg += ` - ${drugs} drugs`;
      if (mats > 0) msg += ` - ${mats} mats`;

      msg += ` = ${rezultat}`;

      // Răspunde în canalul unde e folosită comanda
      await interaction.reply(msg);

      // Trimite și pe un alt canal (log)
      const logChannelId = "1408736167641223289"; // schimbă cu ID-ul canalului dorit
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        logChannel.send(msg);
      }
    }



    // În interactionCreate sau command handler
    if (commandName === 'testtester') {
      const randomQuestions = selectRandomIntrebariTester(intrebaritester, 15);

      // Trimitem mesaj în Discord
      await interaction.reply({
        content: `📝 Iata 15 intrebari alese random:\n${randomQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}`
      });
    }

    if (interaction.commandName === "testadmitere") {
    const numeJucator = interaction.options.getString("nume");

    // alegem 15 întrebări random (sau câte există dacă sunt mai puține)
    const shuffled = intrebari.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 15);

    // construim textul pentru întrebări
    let quizText = `📋 **Mai jos sunt cele 15 întrebări pentru testul de intrare a lui ${numeJucator}:**\n\n`;
    selected.forEach((q, i) => {
      quizText += `**${i + 1}.** ${q.intrebare}\n`;
    });

    // construim textul pentru răspunsuri
    let raspunsuriText = `\n\n✅ **Mai jos sunt răspunsurile la întrebări:**\n\n`;
    selected.forEach((q, i) => {
      raspunsuriText += `${i + 1}. ${q.raspuns}\n`;
    });

    // trimitem totul într-un singur mesaj
    await interaction.reply({ content: quizText + raspunsuriText, ephemeral: false });
  }
    
    // --- FW ---
if (commandName === 'fw') {
    const user = interaction.options.getUser('user');
    const motiv = interaction.options.getString('motiv');
    const member = await interaction.guild.members.fetch(user.id);

    // ID-ul rolului pe care vrei să-l dai la FW
    const FW_ROLE_ID = "1408339822573260841"; // înlocuiește cu ID-ul rolului FW

    // Adăugăm rolul
    const fwRole = interaction.guild.roles.cache.get(FW_ROLE_ID);
    if (fwRole && !member.roles.cache.has(fwRole.id)) {
        await member.roles.add(fwRole).catch(err => console.error(err));
    }

    // Mesaj în canalul curent
    await interaction.reply(`${user} a primit un FW pe motiv: ${motiv}`);

    // Calculăm ziua peste 7 zile
    const data = new Date();
    const dataPlus7 = new Date(data.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ziuaPlus7 = dataPlus7.getDate(); // doar ziua lunii

    // Trimitem mesajul în canalul de log
    const LOG_CHANNEL_ID = "1408339672685477888"; // înlocuiește cu ID-ul canalului de log pentru FW
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        await logChannel.send(`${user.tag} - FW - ${motiv} - ${ziuaPlus7}`);
    }

    // Log intern
    await sendLog(interaction, "FW", user, `Motiv: ${motiv} (ziua peste 7 zile: ${ziuaPlus7}) și rol acordat`);
}

    if (commandName === 'links') {
        // Creează embed-ul
        const embed = new EmbedBuilder()
            .setTitle("Link-uri Importante")
            .setDescription("Regulament mafie: https://forum.g-stone.ro/topic/182249-regulament-mafia-ruseasca/\n" + "Regulament Contracte: https://forum.g-stone.ro/topic/199975-contracte-mafie-rank3/\n" + "Regulament Mafie: https://forum.g-stone.ro/topic/202564-masinile-mafiei-ruse/\n" + "Regulament Raid: https://forum.g-stone.ro/topic/201788-regulament-raid-uri-ofensiv-mafia-ruseasca/\n" + "Regulament Somatii Mafie: https://forum.g-stone.ro/topic/189535-somatii-mafie/\n" + "Cereri rank: https://forum.g-stone.ro/topic/203488-cereri-de-rank-up/\n" + "Cereri invoire: https://forum.g-stone.ro/topic/183476-cereri-de-%C3%AEnvoire/\n" + "Cereri demisie: https://forum.g-stone.ro/topic/202914-cereri-demisi-mafia-ruseasca/")
            .setColor(0x800080) // poți pune orice culoare în hex
            .setTimestamp(); // adaugă timpul curent

        // Trimite embed-ul
        await interaction.reply({ embeds: [embed] });
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
