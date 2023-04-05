module.exports = async (client) => {
    const external = await client.getExternalIp();

    console.log('====== EXTERNAL IP ======\n')
    console.log(JSON.stringify(external, null, 4));
};