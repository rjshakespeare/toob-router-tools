'use strict';

const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function loadPacket(packetName) {
    const packet = JSON.parse(fs.readFileSync(`${__dirname}/packets/${packetName}.json`));
    packet.id = 0;

    return packet;
}

module.exports.Client = class Client {

    constructor(routerIp, username, password) {
        this.routerIp = routerIp;
        this.username = username;
        this.passwordHash = md5(password);

        this.serverNonce = '';
        this.sessionId = 0;
        this.requestId = -1;
    }

    generateCurrentNonce() {
        this.currentNonce = Math.floor(Math.random() * 500000);
    }

    generateRequestId() {
        this.requestId++;
    }

    getCredentialHash() {
        return md5(`${this.username}:${this.serverNonce}:${this.passwordHash}`);
    }

    generateAuthKey() {
        const credentialHash = this.getCredentialHash();
        this.auth = md5(`${credentialHash}:${this.requestId}:${this.currentNonce}:JSON:/cgi/json-req`);
    }

    async makeRequest(actions, priority = false) {
        this.generateRequestId();
        this.generateCurrentNonce();
        this.generateAuthKey();

        const request = {
            'id': this.requestId,
            'session-id': `${this.sessionId}`,
            'priority': priority,
            'actions': actions,
            'cnonce': this.currentNonce,
            'auth-key': this.auth
        };

        const resp = await axios.post(
            `http://${this.routerIp}/cgi/json-req`,
            {
                'request': request
            },
            {
                transformRequest: [
                    data => {
                        return 'req=' + JSON.stringify(data);
                    }
                ]
            }
        ).catch(err => {
            console.log(`Error making request: ${JSON.stringify(err, null, 4)}`);
        });

        return resp.data;
    }

    async login() {
        try {
            const packet = loadPacket('login');
            packet.parameters.user = this.username;

            const resp = await this.makeRequest([packet], true);

            this.sessionId = resp.reply.actions[0].callbacks[0].parameters.id;
            this.serverNonce = resp.reply.actions[0].callbacks[0].parameters.nonce;

            if (!this.sessionId || !this.serverNonce) {
                return false;
            }

            return true;

        } catch (err) {
            console.log(`Error logging in: ${err}, ${JSON.stringify(err)}`);
            return false;
        }
    }

    async restartRouter() {
        return this.makeRequest([loadPacket('restart')]);
    }

    async getEthernet() {
        return (await this.makeRequest([loadPacket('ethernet')])).reply.actions[0].callbacks[0].parameters.value;
    }

    async getPortForwards() {
        return (await this.makeRequest([loadPacket('getports')])).reply.actions[0].callbacks[0].parameters.value;
    }

    async getExternalIp() {
        return (await this.makeRequest([loadPacket('external')])).reply.actions[0].callbacks[0].parameters.value['Interface']['IPv4Addresses'][0]['IPAddress'];
    }

}