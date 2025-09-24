const { BedrockRuntimeClient, ConverseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

exports.handler = async (event) => {
    console.log('=== WEB APP HANDLER START ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Handle different event sources (API Gateway, direct invoke, etc.)
        let userInput = '';
        
        if (event.body) {
            // API Gateway event
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            userInput = body.message || body.input || body.text || 'Hello';
        } else {
            // Direct invoke
            userInput = event.message || event.input || event.text || 'Hello';
        }
        
        console.log('User input:', userInput);
        
        // Use Nova Sonic for speech-to-speech responses
        const request = {
            modelId: 'amazon.nova-sonic-v1:0',
            messages: [
                {
                    role: 'user',
                    content: [{
                        text: userInput
                    }]
                }
            ],
            system: [{
                text: 'You are a helpful AI assistant. Keep responses conversational and engaging. Respond naturally as if having a friendly conversation.'
            }],
            inferenceConfig: {
                maxTokens: 300,
                temperature: 0.7
            }
        };
        
        console.log('Sending request to Nova Sonic...');
        const command = new ConverseStreamCommand(request);
        const response = await client.send(command);
        
        let aiResponse = '';
        for await (const chunk of response.stream) {
            if (chunk.contentBlockDelta?.delta?.text) {
                aiResponse += chunk.contentBlockDelta.delta.text;
            }
        }
        
        console.log('Nova Sonic response:', aiResponse);
        
        // Return appropriate format based on event source
        if (event.httpMethod || event.requestContext) {
            // API Gateway response
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    response: aiResponse,
                    success: true
                })
            };
        } else {
            // Direct invoke response
            return {
                response: aiResponse,
                success: true
            };
        }
        
    } catch (error) {
        console.error('Error:', error);
        
        const errorResponse = {
            response: 'Sorry, I encountered an error. Please try again.',
            success: false,
            error: error.message
        };
        
        if (event.httpMethod || event.requestContext) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(errorResponse)
            };
        } else {
            return errorResponse;
        }
    }
};