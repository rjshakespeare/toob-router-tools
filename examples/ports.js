module.exports = async (client) => {
    const ports = await client.getPortForwards();
    
    console.log('====== PORT FORWARDING ======\n')
    console.log(JSON.stringify(ports, null, 4));
};