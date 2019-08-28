const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SlackBot = require('slackbots');
const axios = require('axios');
const channel = 'testbot';

const bot = new SlackBot({
    token: 'xoxb-732745749425-738661027252-V8UWHorW14qZG0oyFSUCDSVW',
    name: 'Jarvis'
});

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  bot.postMessageToChannel(channel ,`You have the following upcoming events: `)
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 3,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        const eventDetails = `${start} - ${event.summary}`;
        bot.postMessageToChannel(channel , eventDetails);
      });
    } else {
      bot.postMessageToChannel(channel ,  `no event details`);
    }
  });
}

//start handler
bot.on('start', () => {
    const params = {
        icon_emoji: ':robot_face:'
    }

    bot.postMessageToChannel(channel , welcomeMessage(), params)
});


//Message Handler 
bot.on('message', (data) => {
    if(data.type !== 'message'){
        return;
    } 
    console.log(data);
    handleMessage(data.text);
});

function welcomeMessage() 
{
    welcomeMsg = 'Hi there, my name is Jarvis and I am your office assistant, How may I assist you today?. Please type in [help] to view list of avaiable commands ';

    return welcomeMsg;
}

//respond to the message being passed to the bot
function handleMessage(message) 
{
    if (message == 'show upcoming events') {
        bot.postMessageToChannel(channel , getEvents());
    } else if (message == 'view current exchange rates') {
        bot.postMessageToChannel(channel , getCurrentNews());
    } else if (message == 'help') {
        bot.postMessageToChannel(channel , runHelp());
    } else if (message == 'onboarding assistance') {
        getAssistance();
    } else if (message == 'IT') {
        getAssistance_IT();
    } else if (message == 'Special Holidays'){
        getHolidays();
    }
}

function runHelp()
{
    message =  'Jarvis Commands:\n ' +
        ' [ show upcoming events] - check in your google calendar for any upcoming events\n ' +
        ' [ create new events] - add in a new event to your google calendar\n' +
        ' [ Special Holidays] - Display All holidays on your current geographical location\n'+
        ' [ view current exchange rates] - Get updated with todays exchange rates worldwide\n' +
        ' [ view current events] - Get updated with todays current events\n' +
        ' [ get company announcements] - View the latest news about company announcements\n' +
        ' [ onboarding assistance] - Show some tips on how to get you onboard our company \n' +
        ' [ wifi instructions] - Give details regarding office wifi instructions'
        ' [ contact IT helpdesk] - any problems regarding laptops? we can assist you in connecting to our IT helpdesk !\n';
    return message;
   
}

function getEvents()
{
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        authorize(JSON.parse(content), listEvents);
    });
}

function getCurrentNews() {
    bot.postMessageToChannel(channel , 'Here are the list of today\'s current exchange rates');
    const url = 'https://api.exchangeratesapi.io/latest';
    axios.get(url).then(res => {
        const exchangerates = res.data.rates;
        for (let key in exchangerates) {
            let value =  exchangerates[key]; // get the value by key
            bot.postMessageToChannel(channel , `${key}: ${value} \n`);
          }
    });
}

function getHolidays() {
    bot.postMessageToChannel(channel , 'Here are the list of SG Public Holidays');
    const url = 'https://calendarific.com/api/v2/holidays?api_key=fa3dc7c7936bb1640c3722c31d92874cfe95c489&country=SG&year=2019';
    axios.get(url).then(res => {
        const holidays = res.data.response.holidays;
        holidays.map((holiday, i) => {
            const holidayDetails = `${holiday.date.iso} - ${holiday.name}`;
            bot.postMessageToChannel(channel, holidayDetails);
          });
    });

}

function getAssistance() 
{
    bot.postMessageToChannel(channel , 'Welcome to the company! First of all I would like to know which department you are in? You can either choose [Product, IT, Sales, Finance]');
}

function getAssistance_IT() 
{
    bot.postMessageToChannel(channel , 'Hey there! Glad to have you onboard IT department :) Here are a few documentations which will help you get on board:\n' +
    'http://somelinkshere.com ');
}

