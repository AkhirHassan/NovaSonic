const { BedrockRuntimeClient, InvokeModelWithBidirectionalStreamCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({ region: "us-east-1" });

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        const { inputText } = event.Details.Parameters;
        
        // Simple text-to-text with Nova Sonic
        const response = await client.send(new InvokeModelWithBidirectionalStreamCommand({
            modelId: "amazon.nova-sonic-v1:0",
            body: createTextInput(inputText || "Hello")
        }));
        
        let responseText = "";
        for await (const event of response.body) {
            if (event.chunk?.bytes) {
                const textResponse = new TextDecoder().decode(event.chunk.bytes);
                try {
                    const jsonResponse = JSON.parse(textResponse);
                    if (jsonResponse.event?.textOutput) {
                        responseText += jsonResponse.event.textOutput.content;
                    }
                } catch (e) {
                    console.log('Raw response:', textResponse);
                }
            }
        }
        
        return {
            statusCode: 200,
            response: responseText || "Hello from Nova Sonic!"
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            response: "Sorry, I encountered an error."
        };
    }
};

async function* createTextInput(text) {
    // Session start
    yield {
        chunk: {
            bytes: new TextEncoder().encode(JSON.stringify({
                event: {
                    sessionStart: {
                        inferenceConfiguration: {
                            maxTokens: 1024,
                            topP: 0.9,
                            temperature: 0.7
                        }
                    }
                }
            }))
        }
    };
    
    // Prompt start
    yield {
        chunk: {
            bytes: new TextEncoder().encode(JSON.stringify({
                event: {
                    promptStart: {
                        promptName: "prompt-1",
                        textOutputConfiguration: { mediaType: "text/plain" }
                    }
                }
            }))
        }
    };
    
    // Text content start
    yield {
        chunk: {
            bytes: new TextEncoder().encode(JSON.stringify({
                event: {
                    contentStart: {
                        promptName: "prompt-1",
                        contentName: "content-1",
                        type: "TEXT",
                        role: "USER",
                        textInputConfiguration: { mediaType: "text/plain" }
                    }
                }
            }))
        }
    };
    
    // Text input
    yield {
        chunk: {
            bytes: new TextEncoder().encode(JSON.stringify({
                event: {
                    textInput: {
                        promptName: "prompt-1",
                        contentName: "content-1",
                        content: text
                    }
                }
            }))
        }
    };
    
    // Content end
    yield {
        chunk: {
            bytes: new TextEncoder().encode(JSON.stringify({
                event: {
                    contentEnd: {
                        promptName: "prompt-1",
                        contentName: "content-1"
                    }
                }
            }))
        }
    };
    
    // Prompt end
    yield {
        chunk: {
            bytes: new TextEncoder().encode(JSON.stringify({
                event: {
                    promptEnd: {
                        promptName: "prompt-1"
                    }
                }
            }))
        }
    };
    
    // Session end
    yield {
        chunk: {
            bytes: new TextEncoder().encode(JSON.stringify({
                event: {
                    sessionEnd: {}
                }
            }))
        }
    };
}