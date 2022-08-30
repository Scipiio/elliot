
// #############################################################################################################################
// 													NECESSARY CLASSES
// #############################################################################################################################

// Discord.js classes
const { ActionRowBuilder,
		ButtonBuilder, 
		ButtonStyle, 
		EmbedBuilder, 
		Client, 
		AttachmentBuilder,
		GatewayIntentBits } = require('discord.js');
const { token,tokenAPI } = require('./.data/config.json');

// API classes
const weather = require('weather-js');
const NewsAPI = require('newsapi');
process.env.TZ = 'Europe/Paris'

// Utils classes
const fs = require('fs');
const stringify = require('json-stringify-safe')
const cluster = require('cluster');
const schedule = require('node-schedule');
const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

let save = () => {
	console.log('----------------------------\nSauvegarde des variables\n')
	setTimeout(() => {
		let obj = {
			MAIN_MESSAGE: MAIN_MESSAGE
		}

		fs.writeFile('save-data.json', stringify(obj), 'utf8', () => {});
	}, 500)
}

let load = () => {
	fs.readFile('save-data.json', 'utf8', (err, data) => {
		if (err){
			console.log("Aucun fichier de sauvegarde trouvé, création d'un fichier vierge");
			save()
		} else {
			obj = JSON.parse(data);
			MAIN_MESSAGE = obj.MAIN_MESSAGE
			console.log("Données restorées")
		}
	});
}

if(cluster.isMaster) {

	cluster.fork();
	cluster.on('disconnect', function(worker)
	{
		console.error('!! CRASHED !!');
		cluster.fork();
	});

} else {

	const client = new Client({ intents: [GatewayIntentBits.Guilds] });
	const newsapi = new NewsAPI(tokenAPI);
	const channelAnnouncement = '307260668388573186';
	//const channelAnnouncement = '307870793688416256'; // TEST

	var iWeather = 0;
	//var dailyMessage = false;
	var MAIN_MESSAGE = "";

	var arrayJSON = {};
	const loadJSON = new Promise((resolve, reject) => {
		fs.readFile('./.data/arrayData.json', 'utf8', (err, data) => {
			if (err) {
				console.error(err);
				return;
			}

			arrayJSON = JSON.parse(data);
			resolve(arrayJSON);
		});
	});

/*
	let selectedSources
	let selectedWeather
	let skynameTranspose.name
	let skynameTranspose.emoji
	let introArray 
	let sentenceArray 
	let presentationArray 
*/


	client.once('ready', () => {
		console.log('Ready!');

		load()
	});

	
	client.on('interactionCreate', async interaction => {
		if (!interaction.isChatInputCommand()) return;

		const { commandName } = interaction;

		if (commandName === 'forcenews') {
			console.log('forceDaily')
			let msg = await createEmbed();
			await interaction.reply(msg);
		}
	});


	const dailySend = schedule.scheduleJob('* 8 * * *', async function(){
		let msg = await createEmbed(true);
		MAIN_MESSAGE = await sendReport(msg);
		save();
	});

	const updateWeather = schedule.scheduleJob('10,30,50 8-20 * * *', async function(){
		let msg = await createEmbed(false);
		editMSG = await client.channels.cache.get(channelAnnouncement).messages.fetch(MAIN_MESSAGE.id);
		editMSG.edit(msg);
		save();
	});

	async function sendReport(txt) {
		let message = await client.channels.cache.get(channelAnnouncement).send(txt)
		return message;
	}

	function transposeEmoji(skyname) {
		let obj = arrayJSON.skynameTranspose;

		for(var i = 0; i < obj.length; i++) {
			if(obj[i].name == skyname) {
				return obj[i].emoji;
			}
		}
	}

	function requestNews() {
		let newsArray = [];
		let selectedSources = arrayJSON.selectedSources;

		return new Promise((resolve, reject) => {

			newsapi.v2.topHeadlines({
				category: 'general', 
				language: 'fr',
				country: 'fr'
			}).then(newsReport => {
				//console.log(newsReport)
				let itemsProcessed = 0;

				newsReport.articles.forEach(article => {
					//console.log(article)
					//itemsProcessed++;
					if(selectedSources.includes(article.source.name)){
						//console.log(article.title)
						//console.log(newsArray)
						newsArray.push(article);
					}
					/*if(itemsProcessed === newsReport.articles.length) {
						resolve(newsArray);
					}*/
				})
				resolve(newsArray);
			});
		});
	}

	function promiseWeather(location) {
		return new Promise(function fetchWeather(resolve, reject) {
			weather.find({search: location, degreeType: 'C'}, (err, result) => {
			if(err) {
				console.log(err);
				fetchWeather(resolve, reject);
				return;
			}

			console.log('Researching weather: ' + location)
			//console.log(result)

			let city = location.split(', ');
			resolve([result[0].current.temperature, result[0].current.skytext, city[0]]);
			});	
		});
	}

	async function requestWeather() {
		return new Promise(async (resolve, reject) => {
			let selectedWeather = arrayJSON.selectedWeather;
			let array = [];

			for (var i = 0; i < selectedWeather.length; i++) {
				let result = await promiseWeather(selectedWeather[i]);
				array.push(result);
			}
			//console.log(array);
			resolve(array)
		});
	}


	function generateDailyMessage() {

		let introArray = arrayJSON.introArray;
		let sentenceArray = arrayJSON.sentenceArray;
		let presentationArray = arrayJSON.presentationArray;

		let intro = introArray[Math.floor(Math.random() * introArray.length)];
		let sentence = sentenceArray[Math.floor(Math.random() * sentenceArray.length)];
		let presentation = presentationArray[Math.floor(Math.random() * presentationArray.length)];

		let message = intro + '\n' + sentence + '\n' + presentation + '\n';
		return message;
	}

	async function createEmbed(isNew) {

		return new Promise(async (resolve, reject) => {
			const earth = new AttachmentBuilder('./.data/spinning_earth.gif');
			const icon  = new AttachmentBuilder('./.data/icon.png');
			const logo  = new AttachmentBuilder('./.data/scicorp_logo.png');
			const d = new Date()
			let titleTxt = 'Bulletin News du ' + d.getDate() + ' ' + monthNames[d.getMonth()] + ', présenté par Elliot'

			const embed = new EmbedBuilder()
				.setColor(0x00C8BB)
				.setThumbnail('attachment://spinning_earth.gif')
				.setAuthor({name: titleTxt, iconURL: 'attachment://icon.png'})
				.setTimestamp()
				.setFooter({text: 'Ce message vous est présenté par Sci//Corp', iconURL: 'attachment://scicorp_logo.png'});


			// WEATHER REPORTS

			var weather = await requestWeather();
			//console.log(weather);

			weather.forEach(location => {
				let emoji = transposeEmoji(location[1]) === undefined ? location[1] : transposeEmoji(location[1]);
				let weatherReport = location[0] + '°C⠀' + emoji;

				embed.addFields({ name: location[2], value: weatherReport, inline: true});
			})


			if(isNew){
				embed.setDescription(generateDailyMessage())
				embed.addFields({name: '————————————————————————————', value: '⠀ '})
				// NEWS REPORTS

				var newsReport = await requestNews();
				//console.log(newsReport);

				newsReport.forEach(article => {

					let articleName = article.title.split(' - ');
					let articleTitle = '';
					let articleSource

					console.log(articleName)

					if(articleName.length > 2){
						for(let n = 0 ; n < articleName.length - 1 ; n++){
							articleTitle = articleName[n] + ' - ' + articleTitle
							console.log(articleTitle + '  - ' + n)
						}
						articleSource = articleName[articleName.length - 1]
					} else {
						articleTitle = articleName[0]
						articleSource = articleName[1]
					}

					articleTitle = '[' + articleTitle + '](' + article.url + ')'

					embed.addFields({name: articleSource, value: articleTitle})
					
				});

				console.log('Sending daily report');
			
			} else {
				embed.setDescription(MAIN_MESSAGE.embeds[0].description);

				for (var i = 0; i < MAIN_MESSAGE.embeds[0].fields.length; i++) {
					if(MAIN_MESSAGE.embeds[0].fields[i].inline == false){
						embed.addFields({name: MAIN_MESSAGE.embeds[0].fields[i].name, value: MAIN_MESSAGE.embeds[0].fields[i].value});
					}
				}
				console.log('Updating report');
			}
			resolve({ embeds: [embed], files: [earth,icon,logo] });
		})
	}


	client.login(token);
}