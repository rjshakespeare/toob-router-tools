module.exports = async (client) => {
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
};