const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

exports.handler = async (event) => {
    console.log('=== LEX NOVA SONIC HANDLER ===');
    console.log('Lex Event:', JSON.stringify(event, null, 2));
    
    try {
        // Get user input from Lex
        const userInput = event.inputTranscript || event.currentIntent?.slots?.UserInput || 'Hello';
        console.log('User speech input:', userInput);
        
        // Try Nova Sonic first
        try {
            const novaRequest = {
                modelId: 'amazon.nova-sonic-v1:0',
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: userInput
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            };
            
            console.log('Trying Nova Sonic...');
            const novaCommand = new InvokeModelCommand(novaRequest);
            const novaResponse = await client.send(novaCommand);
            const novaBody = JSON.parse(new TextDecoder().decode(novaResponse.body));
            
            const aiResponse = novaBody.content?.[0]?.text || novaBody.completion || 'I understand.';
            console.log('Nova Sonic response:', aiResponse);
            
            return {
                sessionAttributes: event.sessionAttributes || {},
                dialogAction: {
                    type: 'Close',
                    fulfillmentState: 'Fulfilled',
                    message: {
                        contentType: 'PlainText',
                        content: aiResponse
                    }
                }
            };
            
        } catch (novaError) {
            console.log('Nova Sonic failed, falling back to Claude:', novaError.message);
            
            // Fallback to Claude
            const claudeRequest = {
                modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: 200,
                    messages: [
                        {
                            role: 'user',
                            content: `You are a helpful AI assistant. Keep responses short. User said: "${userInput}"`
                        }
                    ]
                })
            };
            
            const claudeCommand = new InvokeModelCommand(claudeRequest);
            const claudeResponse = await client.send(claudeCommand);
            const claudeBody = JSON.parse(new TextDecoder().decode(claudeResponse.body));
            
            const aiResponse = claudeBody.content?.[0]?.text || 'I understand.';
            console.log('Claude fallback response:', aiResponse);
            
            return {
                sessionAttributes: event.sessionAttributes || {},
                dialogAction: {
                    type: 'Close',
                    fulfillmentState: 'Fulfilled',
                    message: {
                        contentType: 'PlainText',
                        content: aiResponse
                    }
                }
            };
        }
        
    } catch (error) {
        console.error('Error:', error);
        return {
            sessionAttributes: event.sessionAttributes || {},
            dialogAction: {
                type: 'Close',
                fulfillmentState: 'Failed',
                message: {
                    contentType: 'PlainText',
                    content: 'Sorry, I encountered an error. Please try again.'
                }
            }
        };
    }
};