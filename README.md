![Elliot](https://media.discordapp.net/attachments/472319579138293761/1088388781515743252/elliot-logo.png?width=960&height=337)

# Elliot

Discord bot displaying daily news and local weather in an embed message. Can also interacte with text-davinci-003 when mentionning Elliot.

Working with :
* [discord.js](https://discord.js.org/#/)
* [news API](https://newsapi.org/docs/client-libraries/node-js)
* [OpenWeather](https://openweathermap.org/api)
* [node-schedule](https://www.npmjs.com/package/node-schedule)
* [openai](https://www.npmjs.com/package/openai)

![Bulletin](https://cdn.discordapp.com/attachments/472319579138293761/1088394859167109120/image.png)

# Documentation

Automatically send a report at 8 a.m and update temperatures and weather of selected cities every hour from 9 a.m to 7 p.m, using `scheduleJob` from `node-schedule`

`arrayData.json` gathers :
* Selected News Sources, to filter and lighten the report
* Selected cities for the weather report, using latitude and longitude coordinates
* Emoji transposer, selecting which emoji correspond to a weather label
* Introduction sentences, randomly generated each day
