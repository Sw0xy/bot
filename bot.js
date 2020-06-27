const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const chalk = require('chalk');
const fs = require('fs');
const moment = require('moment');
const db = require("quick.db");
require('./util/eventLoader')(client);

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};


client.elevation = message => {
  if(!message.guild) {
	return; }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on('warn', e => {
  console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
  console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});

client.login(ayarlar.token);
//GırısDM


// DESTEK SİSTEMİ

client.on('message', async msg => {
  
  
  let destekkanal = '725024612806819971' // Bir şey yazınca talep açacak kanalın ID
  let destekrol = '724224252277948426' // Açılan kanala müdahale edebilecek destek ekibinin rol ID
  let kategori = '726480628773814292' // Açılan kanalın yerleştirileceği kategori ID
  
  
  const reason = msg.content.split(" ").slice(1).join(" ");
  if (msg.channel.id === destekkanal) { 
    if(msg.author.id === ayarlar.sahip) return
    if(msg.author.bot) return
    if (!msg.guild.roles.has(destekrol)) return msg.channel.send(`Sunucuda, belirtilen destek rolü bulunmadığı için destek talebi açılamadı!`);
    if(msg.guild.channels.get(kategori)) {
      let destekno = await db.fetch(`desteknumara`)
      db.add(`desteknumara`, +1)
      msg.guild.createChannel(`destek-${destekno}`, "text").then(c => {
      const category = msg.guild.channels.get(kategori)
      c.setParent(category.id)
      let role = msg.guild.roles.get(destekrol);
      let role2 = msg.guild.roles.find("name", "@everyone");
      c.overwritePermissions(role, {
          SEND_MESSAGES: true,
          READ_MESSAGES: true
      });
      c.overwritePermissions(role2, {
          SEND_MESSAGES: false,
          READ_MESSAGES: false
      });
      c.overwritePermissions(msg.author, {
          SEND_MESSAGES: true,
          READ_MESSAGES: true
      });

      const embed = new Discord.RichEmbed()
      .setColor("RANDOM")
      .addField(`Merhaba ${msg.author.username}!`, `Destek yetkilileri burada seninle ilgilenecektir. \nDestek talebini kapatmak için \`talep kapat\` yazabilirsin.`)
      .addField(`» Kullanıcı:`, msg.author, true)
      .addField(`» Talep Konusu/Sebebi:`, msg.content, true)
      .setFooter(`${client.user.username} Destek Sistemi`, client.user.avatarURL)
      .setTimestamp()
      c.send({ embed: embed });
      c.send(`${msg.author} kişisi destek talebi açtı! @here`)
      msg.delete()
      }).catch(console.error);
    }
  }
});
  
client.on("message", message => {
if (message.content.toLowerCase() === "talep kapat") {
    if (!message.channel.name.startsWith(`destek-`)) return
    if(message.author.bot) return
    message.channel.send(`Destek talebini kapatmayı onaylıyorsan **10 saniye** içinde  \`evet\`  yazmalısın!`)
    .then((m) => {
      message.channel.awaitMessages(response => response.content.toLowerCase() === 'evet', {
        max: 1,
        time: 10000,
        errors: ['time'],
      })
      .then((collected) => {
          message.channel.delete();
        })
        .catch(() => {
          m.edit('Destek Talebi kapatma isteğin zaman aşımına uğradı!').then(m2 => {
              m2.delete();
          }, 3000);
        });
    });
}
});

// DESTEK SİSTEMİ BİTİŞ



client.on('message', async message => {
    const ms = require('parse-ms');

  
  if(message.author.bot) return;
  if(!message.guild) return;
  if(message.content.includes(`${prefix}afk`)) return;
      let sebepp = await db.fetch(`afk_${message.author.id}`);
    var REASON = await db.fetch(`afk_${message.author.id}`);
  if(await db.fetch(`afk_${message.author.id}`)) {
      var user = message.mentions.users.first();
    let zamans = await db.fetch(`afksüre_${message.author.id}`);
  const isim = db.fetch(`afkAd_${message.author.id}_${message.guild.id}`)
    let timeObj = ms(Date.now() - zamans);
    const embed1 = new Discord.RichEmbed()
    .setColor("RANDOM")
    .setTitle('Titan Web Site')
    .setURL('http://titanlar.net') 
    .setDescription(`**AFK** Modundan Başarıyla Çıkış Yaptın. 🥳 \n\n Bizimle Olmadığın Süre:` )
    .addField(`Saat `,`${timeObj.hours}`,true)
                  .addField(`Dakika `,`${timeObj.minutes}`,true)
                  .addField(`Saniye `,`${timeObj.seconds}`,true)
                  .setFooter('Titanlar AFK Sistemi');
    
      message.channel.send(embed1)
    message.member.setNickname(isim)
    
      
        db.delete(`afk_${message.author.id}`);
    db.delete(`afksüre_${message.author.id}`);
  }
  
  var user = message.mentions.users.first();
  if(!user) return;
  var REASON = await db.fetch(`afk_${user.id}`);
  
  if(REASON) {
    let zamant = await db.fetch(`afksüre_${user.id}`);
    let timeObj = ms(Date.now() - zamant);
const embed = new Discord.RichEmbed()
     .setDescription(`<@${user.id}> kullanıcısı **${REASON}** Sebebi İle **AFK** \n\n **AFK** Süresi:`)
                  .setColor("RANDOM")
                  .setTitle('Titan Web Site')
                  .setURL('http://titanlar.net')   
                  .addField(`Saat `,`${timeObj.hours}`,true)
                  .addField(`Dakika `,`${timeObj.minutes}`,true)
                  .addField(`Saniye `,`${timeObj.seconds}`,true)
                  .setFooter('Titanlar AFK Sistemi');

        
    message.channel.send(embed)
  }
});