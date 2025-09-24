const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({ region: "ap-southeast-2" });

exports.handler = async (event) => {
    console.log('=== LAMBDA START ===');
    console.log('Full Connect Event:', JSON.stringify(event, null, 2));
    
    try {
        // Log all possible input sources
        console.log('Event Details:', JSON.stringify(event.Details, null, 2));
        console.log('Event Parameters:', JSON.stringify(event.Details?.Parameters, null, 2));
        
        // Get customer input from Connect
        const customerInput = event.Details?.Parameters?.customerInput;
        console.log('Raw customerInput:', customerInput);
        console.log('customerInput type:', typeof customerInput);
        console.log('customerInput length:', customerInput?.length);
        
        // Check if input is empty or undefined
        if (!customerInput || customerInput.trim() === '') {
            console.log('WARNING: No customer input received!');
            return {
                statusCode: 200,
                response: "I didn't hear anything. Could you please speak again?"
            };
        }
        
        const processedInput = customerInput.trim();
        console.log('Processed input for Claude:', processedInput);
        
        // Use Claude for text processing
        console.log('Sending request to Claude...');
        const response = await client.send(new InvokeModelCommand({
            modelId: "anthropic.claude-3-haiku-20240307-v1:0",
            contentType: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 200,
                messages: [
                    {
                        role: "user",
                        content: `You are a helpful AI assistant. Keep responses short and conversational. Customer said: "${processedInput}"`
                    }
                ]
            })
        }));
        
        console.log('Claude response received');
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        console.log('Claude response body:', JSON.stringify(responseBody, null, 2));
        
        const aiResponse = responseBody.content?.[0]?.text || "I'm here to help you.";
        console.log('Final AI response:', aiResponse);
        
        const result = {
            statusCode: 200,
            response: aiResponse
        };
        console.log('Returning result:', JSON.stringify(result, null, 2));
        console.log('=== LAMBDA SUCCESS ===');
        
        return result;
        
    } catch (error) {
        console.error('=== LAMBDA ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        
        const errorResult = {
            statusCode: 200,
            response: "I'm sorry, I'm having trouble right now. Please try again."
        };
        console.log('Returning error result:', JSON.stringify(errorResult, null, 2));
        console.log('=== LAMBDA ERROR END ===');
        
        return errorResult;
    }
};