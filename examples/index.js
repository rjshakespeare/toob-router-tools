const fs = require('fs');

require('dotenv').config({
    path: fs.existsSync(`${__dirname}/.env`) ? `${__dirname}/.env` : `${__dirname}/default.env`
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

    const examples = fs.readdirSync(__dirname)
        .filter(file => (
            file.endsWith('.js') && file !== 'index.js'
        ))
        .map(file => (
            file.substring(0, file.length - 3)
        ))
        .join(', ');

    console.log(`Examples: [${examples}]`);
    readline.question('Which example would you like to use today? ', (example) => {
        example = example.toLowerCase();

        if (fs.existsSync(`${__dirname}/${example}.js`)) {
            loadExample(example);
        } else {
            console.log('Invalid example.');
        }
        
        readline.close();
    });

})();