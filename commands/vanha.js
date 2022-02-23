async function execute(message, serverQueue) {
	const args = message.content.split(' ');
	const voiceChannel = message.member.voice.channel;

	if (!voiceChannel) {
		return message.channel.send('You need to be in a voice channel to play music!');
	}
	const perms = voiceChannel.permissionsFor(message.client.user);
	if (!perms.has('CONNECT') || !perms.has('SPEAK')) {
		return message.channel.send('I need permissions to join and speak in your voice channel!');
	}

	const songInfo = await ytdl.getInfo(args[1]);
	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
	};

	if (!serverQueue) {
		const queueConstruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connectionId: null,
			songs: [],
		};
		queue.set(message.guild.id, queueConstruct);
		queueConstruct.songs.push(song);
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});

		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 5e3);
			queueConstruct.connectionId = connection.guildId;
			serverQueue.songs.push(song);
			console.log(serverQueue.songs);
			message.channel.send(`${song.title} has been added to the queue! <a:YEPJAM:889931727592644649>`);
			play(message.guild, queueConstruct.songs[0]);
		}
		catch (error) {
			connection.destroy();
			console.log('executen try catch');
		}
	}
	else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		return message.channel.send(`${song.title} has been added to the queue! <a:YEPJAM:889931727592644649>`);
	}
}