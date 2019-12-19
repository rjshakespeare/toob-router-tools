'use strict';

const crypto = require('crypto');
const axios  = require('axios');
const fs     = require('fs');

function sha512(str) {
    return crypto.createHash('sha512').update(str).digest('hex');
}

function loadPacket(packet) {
    return JSON.parse(fs.readFileSync(`./packets/${packet}.json`));
}

module.exports = class Client {

    constructor(routerIp, username, password) {
        this.routerIp = routerIp;
        this.username = username;
        this.passwordHash = sha512(password);

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
        return sha512(`${this.username}:${this.serverNonce}:${this.passwordHash}`);
    }

    generateAuthKey() {
        const credentialHash = this.getCredentialHash();
        this.auth = sha512(`${credentialHash}:${this.requestId}:${this.currentNonce}:JSON:/cgi/json-req`);
    }

    async makeRequest(actions, priority=false) {
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

            return true;

        } catch (err) {
            console.log(`Error logging in: ${err}, ${JSON.stringify(err)}`);
            return false;
        }
    }

    async restartRouter() {
        return this.makeRequest([loadPacket('restart')]);
    }

}