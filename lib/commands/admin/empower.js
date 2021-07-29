const { Command } = require('discord.js-commando');
const constants = require('../../constants.js');

module.exports = class EmpowerCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'empower',
			group: 'admin',
			memberName: 'empower',
			description: 'update roles for all existing members',
			details: '',
			args: [
				{
				key: '',
				prompt: '',
				type: 'string',
				default: '',
				infinite: false,
				wait: 1
			}]
		});
	};

  hasPermission(msg) {
    return this.client.isOwner(msg.author);
  }

	async run(msg, _args) {
		const role = msg.guild.roles.cache.find(r => r.name == 'Member')
		const members = msg.guild.members.filter(m => !m.user.bot && !m.roles.has(role));
		members.forEach(member => member.roles.add(role))
		msg.reply("reol-chan has blessed everyone with the Member role.")
	};
}
