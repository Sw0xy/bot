const Discord = require('discord.js');
const db = require('quick.db');

exports.run = async(client, message, args) => {
   let sebep = args.slice(0).join(' ')
   let user = message.author
   if(!sebep) return message.reply('**AFK** sebebini belirtmelisin. `t.afk sebep`')
   else {
       let kullanıcı = message.guild.members.get(message.author.id)
  const b = kullanıcı.displayName
   	db.set(`afk_${user.id}`, sebep)
   	db.set(`afksüre_${user.id}`, Date.now())
    db.set(`afkAd_${message.author.id}_${message.guild.id}`, b)
  

    const embed1 = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle('Titan Web Site')
    .setURL('http://titanlar.net') 
    .setDescription(`${user},  Başarıyla **AFK** moduna geçiş yaptın! Seni etiketleyenlere  **${sebep}**  sebebiyle **AFK** olduğunu söyleyeceğim. ` )
   
                  .setFooter('Titanlar AFK Sistemi');
    
      message.channel.send(embed1)
     
      message.member.setNickname(`[AFK] ` + b)
    
   }
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases:[],
	permlevel: 0
};

exports.help = {
	name: "afk"
}