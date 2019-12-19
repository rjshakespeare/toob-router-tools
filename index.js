const crypto = require('crypto');
const axios  = require('axios');

function sha512(str) {
    return crypto.createHash('sha512').update(str).digest('hex');
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

        const request = {};

        request.id = this.requestId;
        request['session-id'] = `${this.sessionId}`;
        request.priority = priority;
        request.actions = actions;
        request.cnonce = this.currentNonce;
        request['auth-key'] = this.auth;

        const resp = await axios.post(
            `http://${this.routerIp}/cgi/json-req`, 
            {
                'request': request
            },
            {
                transformRequest: [
                    function (data, headers) {
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
            const resp = await this.makeRequest([
                {
                    "id" :0,
                    "method": "logIn",
                    "parameters": { 
                        "user": this.username,
                        "persistent": "true",
                        "session-options": { 
                            "nss": [ 
                                { 
                                    "name": "gtw",
                                    "uri": "http://sagemcom.com/gateway-data"
                                }
                            ],
                            "language": "ident",
                            "context-flags": { 
                                "get-content-name": true,
                                "local-time": true
                            },
                            "capability-depth": 2,
                            "capability-flags": { 
                                "name": true,
                                "default-value": false,
                                "restriction": true,
                                "description": false
                            },
                            "time-format": "ISO_8601",
                            "write-only-string": "_XMO_WRITE_ONLY_",
                            "undefined-write-only-string": "_XMO_UNDEFINED_WRITE_ONLY_"
                        }
                    }
                }
            ], true);

            this.sessionId = resp.reply.actions[0].callbacks[0].parameters.id;
            this.serverNonce = resp.reply.actions[0].callbacks[0].parameters.nonce;

            return true;

        } catch (err) {
            console.log(`Error logging in: ${err}, ${JSON.stringify(err)}`);
            return false;
        }
    }

    async restartRouter() {
        return this.makeRequest([
            {
                "id": 0,
                "method": "reboot",
                "xpath": "Device",
                "parameters": { 
                    "source": "GUI"
                }
            }
        ]);
    }

}