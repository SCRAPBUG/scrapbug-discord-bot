
// Start
require('dotenv').config();
const fs = require('node:fs');
const discord = require('discord.js');
const { clientId, guildId } = require('./config.json');


const client = new discord.Client({
	intents: [
		discord.Intents.FLAGS.GUILDS,
		discord.Intents.FLAGS.GUILD_MESSAGES,
		discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
	],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER'],
});


// Commands
client.commands = new discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
};

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Startup

client.once('ready', async () => {
	console.log(`logged in as ${client.user.tag}`);
});

// Reactions

const reactionDB = require('./reactions/reactions.json');

client.on('messageReactionAdd', async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

	if (reaction.message.channel.id === reactionDB.channelID) {
		reactionDB.jams.forEach(obj => {
			if (obj.charID === reaction.emoji.identifier && obj.msgID === reaction.message.id) {

				reaction.message.guild.members.fetch(user.id).then(member => {
					reaction.message.guild.roles.fetch(obj.roleID).then(role => {
						member.roles.add(role);
					});
				});
			};
		});
	};
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

	if (reaction.message.channel.id === reactionDB.channelID) {
		reactionDB.jams.forEach(obj => {
			if (obj.charID === reaction.emoji.identifier && obj.msgID === reaction.message.id) {

				reaction.message.guild.members.fetch(user.id).then(member => {
					reaction.message.guild.roles.fetch(obj.roleID).then(role => {
						member.roles.remove(role);
					});
				});
			};
		});
	};
});

// Login

client.login(process.env.CLIENT_TOKEN);