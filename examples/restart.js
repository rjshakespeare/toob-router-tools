module.exports = async (client) => {
    console.log('Restarting router...');

    await client.restartRouter();
    
    console.log('Success! Router is restarting.');
};