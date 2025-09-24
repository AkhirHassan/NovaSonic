import { ConnectParticipantClient, CreateParticipantConnectionCommand, SendMessageCommand } from "@aws-sdk/client-connectparticipant";
import { fromIni } from "@aws-sdk/credential-providers";

export class ConnectIntegration {
    private participantClient: ConnectParticipantClient;
    private connectionToken?: string;

    constructor() {
        this.participantClient = new ConnectParticipantClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: fromIni({ profile: process.env.AWS_PROFILE || 'default' })
        });
    }

    async initializeConnection(participantToken: string) {
        const command = new CreateParticipantConnectionCommand({
            ParticipantToken: participantToken,
            Type: ["CONNECTION_CREDENTIALS"]
        });

        const response = await this.participantClient.send(command);
        this.connectionToken = response.ConnectionCredentials?.ConnectionToken;
        return this.connectionToken;
    }

    async sendTranscript(message: string, role: 'CUSTOMER' | 'AGENT') {
        if (!this.connectionToken) throw new Error("Connection not initialized");

        const command = new SendMessageCommand({
            ConnectionToken: this.connectionToken,
            Content: message,
            ContentType: "text/plain"
        });

        return await this.participantClient.send(command);
    }
}