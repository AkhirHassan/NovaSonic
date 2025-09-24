"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectIntegration = void 0;
const client_connectparticipant_1 = require("@aws-sdk/client-connectparticipant");
const credential_providers_1 = require("@aws-sdk/credential-providers");
class ConnectIntegration {
    constructor() {
        this.participantClient = new client_connectparticipant_1.ConnectParticipantClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: (0, credential_providers_1.fromIni)({ profile: process.env.AWS_PROFILE || 'default' })
        });
    }
    async initializeConnection(participantToken) {
        const command = new client_connectparticipant_1.CreateParticipantConnectionCommand({
            ParticipantToken: participantToken,
            Type: ["CONNECTION_CREDENTIALS"]
        });
        const response = await this.participantClient.send(command);
        this.connectionToken = response.ConnectionCredentials?.ConnectionToken;
        return this.connectionToken;
    }
    async sendTranscript(message, role) {
        if (!this.connectionToken)
            throw new Error("Connection not initialized");
        const command = new client_connectparticipant_1.SendMessageCommand({
            ConnectionToken: this.connectionToken,
            Content: message,
            ContentType: "text/plain"
        });
        return await this.participantClient.send(command);
    }
}
exports.ConnectIntegration = ConnectIntegration;
