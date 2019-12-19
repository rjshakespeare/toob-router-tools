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

const login = async () => {
    console.log('Logging into router...');

    if (!await client.login()) {
        console.log('Failed: Incorrect credentials.');
        return;
    }

    console.log('Logged in!\n');
};

(async () => {
    await login();

    const devices = await client.getEthernet();
    
    console.log('====== ALL DEVICES ======\n')
    devices.forEach(dev => 
        console.log(`${dev.UserHostName.length ? dev.UserHostName : dev.UserFriendlyName}:\n` + 
                    `   IPv4: ${dev.IPAddress} (${dev.AddressSource})\n`)
    );

    console.log('\n\n====== CONNECTED DEVICES ======\n')
    devices
        .filter(dev => dev.IPAddress)
        .forEach(dev => 
            console.log(`${dev.UserHostName.length ? dev.UserHostName : dev.UserFriendlyName}:\n` + 
                        `   IPv4: ${dev.IPAddress} (${dev.AddressSource})\n`)
    );
})();