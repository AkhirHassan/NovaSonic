const { BedrockRuntimeClient, ConverseStreamCommand, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

exports.handler = async (event) => {
    console.log('=== LEX NOVA SONIC LAMBDA START ===');
    console.log('Full Lex Event:', JSON.stringify(event, null, 2));
    
    try {
        // Handle Lex V2 event format
        const customerInput = event.inputTranscript || event.transcriptions?.[0]?.transcription || 'Hello';
        
        console.log('Customer input:', customerInput);
        console.log('Event keys:', Object.keys(event));
        
        let aiResponse = '';
        
        // Try Nova Sonic first
        try {
            console.log('Trying Nova Sonic...');
            const novaRequest = {
                modelId: 'amazon.nova-sonic-v1:0',
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: customerInput
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7,
                    system: 'You are a helpful AI assistant. Keep responses conversational and under 100 words.'
                })
            };
            
            const novaCommand = new InvokeModelCommand(novaRequest);
            const novaResponse = await client.send(novaCommand);
            const novaBody = JSON.parse(new TextDecoder().decode(novaResponse.body));
            
            aiResponse = novaBody.content?.[0]?.text || novaBody.completion || novaBody.output || '';
            console.log('Nova Sonic response:', aiResponse);
            
        } catch (novaError) {
            console.log('Nova Sonic failed, using Claude fallback:', novaError.message);
            
            // Fallback to Claude 3 Haiku
            const claudeRequest = {
                modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
                messages: [
                    {
                        role: 'user',
                        content: [{
                            text: customerInput
                        }]
                    }
                ],
                system: [{
                    text: 'You are a helpful AI assistant. Keep responses conversational and under 100 words.'
                }],
                inferenceConfig: {
                    maxTokens: 200,
                    temperature: 0.7
                }
            };
            
            const claudeCommand = new ConverseStreamCommand(claudeRequest);
            const claudeResponse = await client.send(claudeCommand);
            
            for await (const chunk of claudeResponse.stream) {
                if (chunk.contentBlockDelta?.delta?.text) {
                    aiResponse += chunk.contentBlockDelta.delta.text;
                }
            }
            
            console.log('Claude 3 Haiku response:', aiResponse);
        }
        
        // Return Lex V2 response format
        return {
            sessionState: {
                dialogAction: {
                    type: 'Close'
                },
                intent: {
                    name: event.sessionState?.intent?.name || 'FallbackIntent',
                    state: 'Fulfilled'
                }
            },
            messages: [
                {
                    contentType: 'PlainText',
                    content: aiResponse || 'I understand. How else can I help you?'
                }
            ]
        };
        
    } catch (error) {
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return {
            sessionState: {
                dialogAction: {
                    type: 'Close'
                },
                intent: {
                    name: event.sessionState?.intent?.name || 'FallbackIntent',
                    state: 'Failed'
                }
            },
            messages: [
                {
                    contentType: 'PlainText',
                    content: 'Sorry, I encountered an error. Please try again.'
                }
            ]
        };
    }
};