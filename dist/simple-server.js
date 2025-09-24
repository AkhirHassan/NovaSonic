"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const credential_providers_1 = require("@aws-sdk/credential-providers");
// Configure AWS credentials for new account
const AWS_PROFILE_NAME = 'new-account';
const LAMBDA_FUNCTION_NAME = 'nova-speech-app';
const AWS_REGION = 'us-east-1';
// Create Express app and HTTP server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
// Create Lambda client
const lambdaClient = new client_lambda_1.LambdaClient({
    region: AWS_REGION,
    credentials: (0, credential_providers_1.fromIni)({ profile: AWS_PROFILE_NAME })
});
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    // Handle text input from web app
    socket.on('textInput', async (data) => {
        try {
            console.log('Text input received:', data);
            const payload = {
                message: data.text || data.message || data
            };
            const command = new client_lambda_1.InvokeCommand({
                FunctionName: LAMBDA_FUNCTION_NAME,
                Payload: JSON.stringify(payload)
            });
            const response = await lambdaClient.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.Payload));
            console.log('Lambda response:', result);
            socket.emit('textOutput', {
                text: result.response,
                success: result.success
            });
        }
        catch (error) {
            console.error('Error processing text input:', error);
            socket.emit('error', {
                message: 'Error processing your request',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // Handle audio input (convert to text first, then process)
    socket.on('audioInput', async (audioData) => {
        try {
            console.log('Audio input received, length:', audioData.length);
            // For now, send a placeholder message to Lambda
            // In production, you'd use speech-to-text service first
            const payload = {
                message: "Hello, I spoke something to you" // Placeholder
            };
            const command = new client_lambda_1.InvokeCommand({
                FunctionName: LAMBDA_FUNCTION_NAME,
                Payload: JSON.stringify(payload)
            });
            const response = await lambdaClient.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.Payload));
            console.log('Lambda response for audio:', result);
            socket.emit('textOutput', {
                text: result.response,
                success: result.success
            });
        }
        catch (error) {
            console.error('Error processing audio input:', error);
            socket.emit('error', {
                message: 'Error processing audio',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        account: 'new-account',
        region: AWS_REGION,
        lambda: LAMBDA_FUNCTION_NAME
    });
});
// Test Lambda endpoint
app.get('/test-lambda', async (req, res) => {
    try {
        const payload = {
            message: "Test message from web app"
        };
        const command = new client_lambda_1.InvokeCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            Payload: JSON.stringify(payload)
        });
        const response = await lambdaClient.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.Payload));
        res.json({
            success: true,
            lambda_response: result,
            account: 'new-account'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Start the server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`Simple server listening on port ${PORT}`);
    console.log(`Using AWS account: new-account`);
    console.log(`Lambda function: ${LAMBDA_FUNCTION_NAME}`);
    console.log(`Region: ${AWS_REGION}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server shut down');
        process.exit(0);
    });
});
