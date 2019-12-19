require('dotenv').config({
    path: require('fs').existsSync(`${__dirname}/.env`) ? `${__dirname}/.env` : `${__dirname}/default.env`
});

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const tools = require('optus-router-tools');
const client = new tools.Client(process.env.ROUTER_IP, process.env.ROUTER_USERNAME, process.env.ROUTER_PASSWORD);

const login = async () => {
    console.log('Logging into router...');

    if (!await client.login()) {
        console.log('Failed: Incorrect credentials.');
        return;
    }

    console.log('Logged in!\n');
};

const loadExample = (name) => {
    require(`${__dirname}/${name}`)(client);
}

(async () => {
    await login();

    console.log('Examples: [devices, restart]');
    readline.question('Which example would you like to use today? ', (example) => {
        switch (example.toLowerCase()) {
            case 'devices':
                loadExample('devices');
                break;
            case 'restart':
                loadExample('restart');
                break;
            default:
                console.log('Invalid example.');
        }
        readline.close();
    });

})();