const fs = require('fs');
require('dotenv').config({
    path: (() => {
        if (fs.existsSync('./.env')) {
            return './.env';
        }

        return './default.env'
    })()
});
const Client = require('./index.js');

const client = new Client(process.env.ROUTER_IP, process.env.ROUTER_USERNAME, process.env.ROUTER_PASSWORD);

(async () => {
    console.log('Logging into router...');

    if (!await client.login()) {
        console.log('Failed: Incorrect credentials.');
        return;
    }

    console.log('Logged in!\n');

    
    console.log('Restarting router...');

    await client.restartRouter();
    
    console.log('Success! Router is restarting.');
})();