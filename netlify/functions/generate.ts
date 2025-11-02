import Groq from 'groq-sdk';

// Define the expected structure of the POST body from the frontend
interface RequestBody {
  userInput: string;
  format: 'markdown' | 'json' | 'xml' | 'text';
  frameworkId: string;
  frameworkInstruction: string;
  formatInstructions: Record<string, string>;
}

// Netlify's handler function for serverless execution
export const handler = async (event) => {
  // We only allow POST requests for this function
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Initialize the Groq client with the API key from secure environment variables
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    // Parse the request body sent from the Angular frontend
    const { userInput, format, frameworkInstruction, formatInstructions } = JSON.parse(event.body) as RequestBody;

    // This is the master system instruction that guides the AI's behavior.
    // It's kept on the backend to prevent tampering.
    const systemInstruction = `
You are the Prompt Architect, a specialized AI that transforms simple user ideas into high-quality, structured, and detailed prompts ready for another AI.
Your single, critical task is to take the user's input and expand it into a complete, ready-to-use prompt, formatted according to their request.
---
### ABSOLUTE RULES FOR YOUR OUTPUT ---
Your response MUST be ONLY the raw, unadorned prompt. Failure to follow these rules will result in an invalid output.
1.  **NO WRAPPERS:** Your response MUST NOT contain any markdown code fences like \`\`\`json or \`\`\`.
2.  **NO PREFACE/POSTFACE:** Your response MUST NOT include any introductory or concluding text. Do not say "Here is the prompt" or anything similar.
3.  **NO HEADERS/LABELS:** Your response MUST NOT start with headers or labels like "Prompt:", "### Prompt", or "<prompt>". Start DIRECTLY with the prompt content.
4.  **NO EXPLANATIONS:** Your response MUST NOT contain any explanatory text about the prompt you created.
---
### CORE DIRECTIVES FOR PROMPT GENERATION ---
1.  **EXPAND THE USER'S IDEA INTO A DETAILED PROMPT:** Your primary goal is to take the user's simple idea and expand it into a comprehensive, detailed, and structured prompt. The output should be a complete, ready-to-use prompt that the user can copy and paste into another AI to get a high-quality result.
2.  **INCORPORATE, DON'T REPLACE:** You MUST integrate the user's original idea directly into the prompt you generate. Do NOT replace their idea with generic placeholders. For example, if the user's input is "a 30-day workout plan", that phrase should appear in the final prompt you create.
3.  **ADD STRUCTURE AND DETAIL:** Enhance the user's basic idea by adding relevant sections, questions, and constraints based on the selected framework. For example, for a workout plan, you might add sections for 'Current Fitness Level', 'Available Equipment', 'Goals', 'Constraints'. This makes the prompt more powerful.
4.  **AVOID GENERIC PLACEHOLDERS:** Do NOT use placeholders like "[Insert details here]" or "[Your Goal Here]". The prompt you generate should be a finished product. If details are missing from the user's initial idea, structure the final prompt to ask the *next* AI for them, or provide common options as examples within the prompt.
5.  **ADHERE TO FRAMEWORK:** ${frameworkInstruction}
6.  **ADHERE TO FORMAT:** ${formatInstructions[format]}
7.  **USE DESCRIPTIVE ROOT ELEMENT (FOR XML/JSON):** For XML and JSON formats, the top-level root element or key MUST be descriptive and directly related to the user's core request. AVOID generic names like '<prompt>', '<template>', or '<prompt_template>'.
Your final output will be directly copied and pasted by the user. It must be a complete, powerful, and ready-to-use prompt.
    `.trim();

    // Make the actual API call to Groq
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userInput }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        top_p: 0.9,
    });
      
    const prompt = chatCompletion.choices[0]?.message?.content || '';

    // Send the successful response back to the frontend
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    };

  } catch (error) {
    console.error('Error in Netlify function:', error);
    // Send a generic error message back to the frontend
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'An internal error occurred. Please try again later.' }),
    };
  }
};
