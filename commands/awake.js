const rrcId = '503523714877358090';
const gifut = [
	'https://tenor.com/view/only-one-awake-in-the-server-awake-in-the-server-gif-22072660',
	'https://tenor.com/view/im-the-last-one-awake-gif-20756972',
];

const onlineMembers = message.guild.roles.cache.get(rrcId).members.filter((member) => !member.user?.bot && member.presence?.status == 'online').map((member) => member);
console.log('onlinessa rrc ukkoja: ' + onlineMembers.length);
if (gifut.includes(message.content)) {
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