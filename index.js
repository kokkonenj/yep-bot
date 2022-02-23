const { Client, Intents } = require('discord.js');
const { token, prefix } = require('./config.json');
const ytdl = require('ytdl-core');
const {
	joinVoiceChannel,
	getVoiceConnection,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	generateDependencyReport,
	VoiceReceiver,
} = require('@discordjs/voice');


// Global constants
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_VOICE_STATES,
	] });
const queue = new Map();
const rennelaId = '126303867439677442';
const salaKanavaId = '641063402869096448';
let player = createAudioPlayer();
const rrcId = '503523714877358090';
const gifut = [
	'https://tenor.com/view/only-one-awake-in-the-server-awake-in-the-server-gif-22072660',
	'https://tenor.com/view/im-the-last-one-awake-gif-20756972',
];
let msg = '';
let srQue = '';

// Next song if no song is playing
player.on(AudioPlayerStatus.Idle, () => {
	nextSong(msg, srQue);
});

// Read messages
client.on('messageCreate', async message => {
	if (message.author.bot) return;

	const onlineMembers = message.guild.roles.cache.get(rrcId).members.filter((member) => !member.user?.bot && member.presence?.status == 'online').map((member) => member);
	if (gifut.includes(message.content)) {
		console.log('onlinessa rrc ukkoja: ' + onlineMembers.length);
		if (onlineMembers.length > 1) {
			message.react('🚫');
			console.log('laiton only one awake postattu (' + message.author + ')');
		}
		else {
			message.react('✅');
			console.log('only one awake hyväksytty (' + message.author + ')');
		}
	}
	else if (message.content === '<a:YEPJAM:889931727592644649>') {
		message.react('<a:YEPJAM:889931727592644649>');
	}

	if (!message.content.startsWith(prefix)) return;
	if (message.channel.id != salaKanavaId && message.guild.id == rennelaId) return;

	const serverQueue = queue.get(message.guild.id);

	if (message.content.startsWith('!play')) {
		msg = message;
		srQue = serverQueue;
		play(message, serverQueue);
		return;
	}
	else if (message.content.startsWith('!skip')) {
		skip(message, serverQueue);
		return;
	}
	else if (message.content.startsWith('!queue')) {
		getQueue(message, serverQueue);
		return;
	}
	/*
	else if (message.content.startsWith('!stop')) {
		stop(message, serverQueue);
		return;
	}
	*/
	else {
		message.channel.send('Not a valid command.');
	}
});

async function play(message, serverQueue) {
	// Check if user is in voice channel
	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) {
		return message.channel.send('You need to be in a voice channel to interact!');
	}
	const perms = voiceChannel.permissionsFor(message.client.user);
	if (!perms.has('CONNECT') || !perms.has('SPEAK')) {
		return message.channel.send('I need permissions to join and speak in your voice channel!');
	}
	if (getVoiceConnection(message.guild.id)) {
		if (getVoiceConnection(message.guild.id).joinConfig.channelId != voiceChannel.id) {
			return message.channel.send('You need to be in *my* voice channel to interact!');
		}
	}
	if (serverQueue) {
		if (message.channel.id != serverQueue.textChannelId) return;
	}

	// Process input (args)
	const args = message.content.split(' ');
	if (args.length < 2) {
		return message.channel.send('Enter a link to play.');
	}
	if (!ytdl.validateURL(args[1])) {
		return message.channel.send('Could not validate video URL. Please enter the link to the video.');
	}

	// Get song data
	const songInfo = await ytdl.getInfo(args[1]);
	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
		msLength: songInfo.videoDetails.lengthSeconds * 1000,
	};

	// Create player if it does not exist
	if (!player) {
		player = createAudioPlayer();
	}

	// Establish connection to user's voice channel and subscribe to the audio player
	if (!getVoiceConnection(message.guild.id)) {
		joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		}).subscribe(player);
	}

	// Create the song queue for the server if it doesn't exist already
	if (!serverQueue) {
		const queStruct = {
			textChannelId : message.channel.id,
			songs : [],
		};
		queStruct.songs.push(song);
		queue.set(message.guild.id, queStruct);
		nextSong(message, queStruct);
	}
	else {
		serverQueue.songs.push(song);
		console.log(song.title + ' has been added to the queue.');
		message.channel.send(`${song.title} has been added to the queue.`)
			.catch(console.error);
	}
}

async function nextSong(message, serverQueue) {
	// Create audio resource from the ytdl song and play it.
	let song;
	try {
		song = serverQueue.songs.shift();
	}
	catch (error) {
		message.channel.send('Nothing to play <:mories:914820236098826290>');
		if (!song) {
			queue.delete(message.guild.id);
			return;
		}
	}
	try {
		const songResource = createAudioResource(ytdl(song.url, { quality: 'highestaudio', filter: 'audioonly', highWaterMark: 1 << 25 }), { highWaterMark: 1 });
		player.play(songResource);
		player.on('error', error => {
			console.error(error.message);
			message.channel.send('Could not retrieve song, please try again.');
		});
		console.log(`Now playing: ${song.title}`);
		message.channel.send(`**Now playing**: ${song.title} <a:YEPJAM:889931727592644649>`);
	}
	catch (error) {
		queue.delete(message.guild.id);
		player.stop();
	}
}

/*
function play(guild, song) {
	if (!song) {
		getVoiceConnection(guild.id).destroy();
		queue.delete(guild.id);
		return;
	}
	const songResource = createAudioResource(ytdl(song.url));
	player.play(songResource);
	player.on('error', error => {
		console.error(error);
	});
	const subscription = getVoiceConnection(guild.id).subscribe(player);
	if (!subscription) {
		console.log('eipä ollu');
	}
}
*/

function skip(message, serverQueue) {
	// Check if user is in voice channel
	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) {
		return message.channel.send('You need to be in a voice channel to interact!');
	}
	const perms = voiceChannel.permissionsFor(message.client.user);
	if (!perms.has('CONNECT') || !perms.has('SPEAK')) {
		return message.channel.send('I need permissions to join and speak in your voice channel!');
	}
	if (getVoiceConnection(message.guild.id)) {
		if (getVoiceConnection(message.guild.id).joinConfig.channelId != voiceChannel.id) {
			return message.channel.send('You need to be in *my* voice channel to interact!');
		}
	}
	if (serverQueue) {
		if (message.channel.id != serverQueue.textChannelId) return;
		nextSong(message, serverQueue);
	}
}

async function getQueue(message, serverQueue) {
	// Check if user is in voice channel
	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) {
		return message.channel.send('You need to be in a voice channel to interact!');
	}
	const perms = voiceChannel.permissionsFor(message.client.user);
	if (!perms.has('CONNECT') || !perms.has('SPEAK')) {
		return message.channel.send('I need permissions to join and speak in your voice channel!');
	}
	if (getVoiceConnection(message.guild.id)) {
		if (getVoiceConnection(message.guild.id).joinConfig.channelId != voiceChannel.id) {
			return message.channel.send('You need to be in *my* voice channel to interact!');
		}
	}
	if (serverQueue) {
		if (message.channel.id != serverQueue.textChannelId) return;
		if (serverQueue.songs.length > 0) {
			let mssg = '';
			let i = 1;
			for (const song of serverQueue.songs) {
				mssg = mssg + '**' + i + '.** ' + song.title + '\n';
				i++;
			}
			return message.channel.send(mssg);
		}
		else {
			return message.channel.send('No queue.');
		}
	}
}

/*
function stop(message, serverQueue) {
	if (!message.member.voice.channel) {
		return message.channel.send('You need to be in a voice channel to stop music!');
	}
	if (!serverQueue) {
		return message.channel.send('There is no song to be stopped!');
	}
	serverQueue.songs = [];
	getVoiceConnection(message.guild.id).destroy();
}
*/

client.login(token);

console.log(generateDependencyReport());

client.once('ready', () => {
	console.log('ready!');
});
client.once('reconnecting', () => {
	console.log('reconnecting...');
});
client.once('disconnect', () => {
	console.log('disconnecting...');
});
