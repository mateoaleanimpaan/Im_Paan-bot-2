const { 
  Client, GatewayIntentBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  EmbedBuilder, REST, Routes, SlashCommandBuilder, ChannelType, MessageFlags 
} = require('discord.js');

// ⚙️ CONFIGURACIÓN
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;
const prefix = "m-";
const BOT_COLOR = "#5865F2";

// Cliente
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMembers
  ]
});

// --- CONFIGURACIÓN DINÁMICA ---
let ticketSettings = { categoryId: null, staffRoleId: null, welcomeMessage: "Hola {user}, el Staff te atenderá pronto." };
let guildSettings = { welcomeChannel: null, welcomeMessage: "¡Hola {user}! Bienvenido a **{server}**.", buttonText: "Aceptar Reglas" };

// --- BASE DE COMANDOS ---
const commandDetails = {
  help: { desc: "Muestra la lista de comandos o ayuda de uno específico.", usage: "help [comando]", category: "Utilidad" },
  ban: { desc: "Expulsa permanentemente a un miembro del servidor.", usage: "ban @usuario [razón]", category: "Moderación" },
  mute: { desc: "Silencia a un usuario por tiempo.", usage: "mute [minutos] @usuario [razón]", category: "Moderación" },
  warn: { desc: "Añade una advertencia a un usuario.", usage: "warn @usuario [razón]", category: "Moderación" },
  afk: { desc: "Márcate como ausente con una razón.", usage: "afk [razón]", category: "Utilidad" },
  "setup-tickets": { desc: "Crea el panel de tickets.", usage: "setup-tickets", category: "Tickets" },
  mpresentacion: { desc: "Muestra la tarjeta de presentación del bot.", usage: "/mpresentacion", category: "Utilidad" }
};

// --- PERMISOS ---
function hasPermission(member) {
  return member.id === OWNER_ID || member.permissions.has(PermissionsBitField.Flags.Administrator);
}

// --- FUNCIÓN HELP ---
function getHelpEmbed(userName, userAvatar, search = null) {
  if (search && commandDetails[search]) {
    const detail = commandDetails[search];
    return new EmbedBuilder()
      .setColor(BOT_COLOR)
      .setTitle(`📖 Ayuda: \`${prefix}${search}\``)
      .addFields(
        { name: "📝 Descripción", value: detail.desc },
        { name: "⌨️ Uso", value: `\`${prefix}${detail.usage}\`` },
        { name: "📂 Categoría", value: detail.category, inline: true }
      )
      .setFooter({ text: "Matteos Bot - Ayuda Detallada", iconURL: userAvatar });
  }

  return new EmbedBuilder()
    .setColor(BOT_COLOR)
    .setTitle("🛠️ Panel de Control - Matteos Bot")
    .setThumbnail(userAvatar)
    .setDescription(`¡Hola **${userName}**! Aquí tienes todo lo que puedo hacer.\n\n**Próxima Actualización:**\n• Sistema de Niveles y Economía.\n• Logs avanzados.`)
    .addFields(
      { name: "🛡️ MODERACIÓN", value: "`ban`, `mute`, `warn`", inline: true },
      { name: "🎫 TICKETS", value: "`setup-tickets`", inline: true },
      { name: "✨ UTILIDAD", value: "`afk`, `ping`, `help`", inline: true },
      { name: "👋 BIENVENIDAS", value: "Usa `/mbienvenida ayuda` para configurar.", inline: false }
    )
    .setImage("https://i.imgur.com/8vY8R6Y.png")
    .setTimestamp()
    .setFooter({ text: "Matteos Bot - Creado por im_paan", iconURL: userAvatar });
}

// --- COMANDOS SLASH ---
const slashCommands = [
  new SlashCommandBuilder().setName("mhelp").setDescription("Panel de control total (Privado)").addStringOption(opt => opt.setName("comando").setDescription("Ayuda específica")),
  new SlashCommandBuilder().setName("mpresentacion").setDescription("Muestra la tarjeta de presentación del bot"),
  new SlashCommandBuilder().setName("mping").setDescription("Latencia del bot"),
  new SlashCommandBuilder()
    .setName("mbienvenida")
    .setDescription("Configuración de bienvenidas")
    .addSubcommand(s => s.setName("ayuda").setDescription("Cómo configurar"))
    .addSubcommand(s => s.setName("test").setDescription("Probar sistema")),
  new SlashCommandBuilder()
    .setName("mconfig")
    .setDescription("Configuración avanzada")
    .addSubcommandGroup(g => g.setName("tickets").setDescription("Tickets")
      .addSubcommand(s => s.setName("mensaje").setDescription("Mensaje del ticket").addStringOption(o => o.setName("texto").setRequired(true).setDescription("Usa {user}")))
      .addSubcommand(s => s.setName("staff").setDescription("Rol Staff").addRoleOption(o => o.setName("rol").setRequired(true).setDescription("Rol")))
      .addSubcommand(s => s.setName("categoria").setDescription("Categoría").addChannelOption(o => o.setName("cat").setRequired(true).addChannelTypes(ChannelType.GuildCategory)))
    )
];

// --- LOGIN Y REGISTRO DE COMANDOS ---
client.once("clientReady", async c => {
  console.log(`✅ ${c.user.username} encendido.`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: slashCommands.map(cmd => cmd.toJSON()) });
  } catch (e) { console.error(e); }
});

// --- INTERACCIONES ---
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options, member } = interaction;

    if (commandName === "mhelp") {
      const search = options.getString("comando")?.toLowerCase();
      return interaction.reply({ embeds: [getHelpEmbed(interaction.user.username, interaction.user.displayAvatarURL(), search)], flags: [MessageFlags.Ephemeral] });
    }

    if (commandName === "mpresentacion") {
      const presEmbed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("🚀 ¡Te presento a Matteos Bot!")
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(`¡Hola! Soy el bot definitivo para tu servidor. Creado por **im_paan**.`)
        .addFields(
          { name: "👋 Bienvenidas", value: "Personalizables", inline: true },
          { name: "🛡️ Moderación", value: "Ban, Mute, Warn", inline: true },
          { name: "🎫 Tickets", value: "Soporte profesional", inline: true }
        )
        .setImage("https://i.imgur.com/8vY8R6Y.png");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Invitar Bot").setURL(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setLabel("Servidor de Soporte").setURL("https://discord.gg/tu-invitacion").setStyle(ButtonStyle.Link)
      );

      return interaction.reply({ embeds: [presEmbed], components: [row] });
    }

    if (commandName === "mbienvenida" && options.getSubcommand() === "test") {
      client.emit("guildMemberAdd", interaction.member);
      return interaction.reply({ content: "✅ Prueba enviada.", flags: [MessageFlags.Ephemeral] });
    }

    if (commandName === "mping") return interaction.reply({ content: `🏓 **${client.ws.ping}ms**`, flags: [MessageFlags.Ephemeral] });
  }

  // Botones
  if (interaction.isButton()) {
    if (interaction.customId === "open_ticket") {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: ticketSettings.categoryId,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
      }).catch(() => null);
      if (!channel) return interaction.editReply("❌ Error al crear ticket.");
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("close_ticket").setLabel("Cerrar").setStyle(ButtonStyle.Danger));
      await channel.send({ content: `Hola ${interaction.user}, el Staff te atenderá pronto.`, components: [row] });
      return interaction.editReply(`✅ Ticket: ${channel}`);
    }

    if (interaction.customId === "close_ticket") {
      if (!hasPermission(interaction.member)) return interaction.reply({ content: "❌ Sin permiso.", flags: [MessageFlags.Ephemeral] });
      await interaction.reply("Cerrando...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === "accept_rules_button") {
      const role = interaction.guild.roles.cache.get(MEMBER_ROLE_ID);
      if (role) await interaction.member.roles.add(role).then(() => interaction.reply({ content: "✅ Acceso concedido.", flags: [MessageFlags.Ephemeral] })).catch(() => {});
    }
  }
});

// --- COMANDOS DE TEXTO ---
client.on("messageCreate", async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "help") return message.reply({ embeds: [getHelpEmbed(message.author.username, message.author.displayAvatarURL(), args[0]?.toLowerCase())] });

  if (command === "ban") {
    if (!hasPermission(message.member)) return message.reply("❌ Sin permisos.");
    const target = message.mentions.members.first();
    if (!target) return message.reply("❌ Menciona a alguien.");
    try { await target.ban({ reason: args.slice(1).join(" ") || "Sin razón." }); return message.reply("✅ Baneado."); } catch { return message.reply("❌ Error."); }
  }

  if (command === "mute") {
    if (!hasPermission(message.member)) return message.reply("❌ Sin permisos.");
    const duration = parseInt(args[0]);
    const target = message.mentions.members.first();
    if (!duration || !target) return message.reply(`❌ Uso: \`${prefix}mute [minutos] @usuario\``);
    try { await target.timeout(duration * 60 * 1000, args.slice(2).join(" ") || "Sin razón."); return message.reply("🔇 Silenciado."); } catch { return message.reply("❌ Error."); }
  }

  if (command === "setup-tickets") {
    if (!hasPermission(message.member)) return;
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("open_ticket").setLabel("Abrir Ticket").setStyle(ButtonStyle.Primary).setEmoji("📩"));
    await message.channel.send({ content: "🎫 **Soporte**\nHaz clic abajo.", components: [row] });
    message.delete().catch(() => {});
  }
});

// --- BIENVENIDAS ---
client.on("guildMemberAdd", async member => {
  const channel = guildSettings.welcomeChannel ? member.guild.channels.cache.get(guildSettings.welcomeChannel) : member.guild.systemChannel;
  if (!channel) return;
  const finalMsg = guildSettings.welcomeMessage.replace("{user}", `<@${member.id}>`).replace("{server}", member.guild.name).replace("{count}", member.guild.memberCount);
  const welcomeEmbed = new EmbedBuilder().setColor(BOT_COLOR).setTitle("✨ ¡Bienvenido!").setDescription(finalMsg).setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("accept_rules_button").setLabel(guildSettings.buttonText).setStyle(ButtonStyle.Success).setEmoji("✅"));
  channel.send({ content: `¡Bienvenido ${member}!`, embeds: [welcomeEmbed], components: [row] }).catch(console.error);
});

client.login(TOKEN);
// ------------------- SERVIDOR EXPRESS 24/7 -------------------
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot activo 24/7!"));
app.listen(process.env.PORT || 3000, () => console.log("Servidor web activo"));