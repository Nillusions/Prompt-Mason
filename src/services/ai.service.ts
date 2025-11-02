import { Injectable } from '@angular/core';

export type PromptFramework = 
  | 'standard' | 'reasoning' | 'race' | 'care' | 'ape' 
  | 'create' | 'tag' | 'creo' | 'rise' | 'pain' | 'coast' | 'roses';

export const frameworkOptions: { id: PromptFramework; name: string; description: string; }[] = [
  { id: 'standard', name: 'Standard Prompt – For general use prompt generation', description: 'For general use prompt generation' },
  { id: 'reasoning', name: 'Reasoning Prompt – For reasoning tasks and complex problem solving', description: 'For reasoning tasks and complex problem solving' },
  { id: 'race', name: 'Race [Role, Action, Context, Explanation] – Role-based responses', description: 'RACE Framework [Role, Action, Context, Explanation] – Role-based responses with structured instructions' },
  { id: 'care', name: 'Care [Context, Action, Result, Example] – Helpful, real-world responses', description: 'CARE Framework [Context, Action, Result, Example] – Helpful, real-world responses with practical value' },
  { id: 'ape', name: 'Ape [Action, Purpose, Execution] – Clear task execution', description: 'APE Framework [Action, Purpose, Execution] – Clear task execution with defined goals and outcomes' },
  { id: 'create', name: 'Create [Character, Request, Examples, Adjustments, Type, Extras] – Guided task execution', description: 'CREATE Framework [Character, Request, Examples, Adjustments, Type, Extras] – Clear, specific & guided task execution' },
  { id: 'tag', name: 'Tag [Task, Action, Goal] – Step-by-step tasks', description: 'TAG Framework [Task, Action, Goal] – Step-by-step tasks aimed at achieving a specific result' },
  { id: 'creo', name: 'Creo [Context, Request, Explanation, Outcome] – Structured idea generation', description: 'CREO Framework [Context, Request, Explanation, Outcome] – Structured ideas, strategies, or problem-solving' },
  { id: 'rise', name: 'Rise [Role, Input, Steps, Execution] – Guided learning flows', description: 'RISE Framework [Role, Input, Steps, Execution] – Guided, step-by-step instructions or learning flows' },
  { id: 'pain', name: 'Pain [Problem, Action, Information, Next Steps] – Action-oriented problem-solving', description: 'PAIN Framework [Problem, Action, Information, Next Steps] – Solving problems or getting action-oriented information' },
  { id: 'coast', name: 'Coast [Context, Objective, Actions, Scenario, Task] – Detailed workflow planning', description: 'COAST Framework [Context, Objective, Actions, Scenario, Task] – For detailed workflows or process planning' },
  { id: 'roses', name: 'Roses [Role, Objective, Scenario, Expected Solution, Steps] – Analytical decision-making', description: 'ROSES Framework [Role, Objective, Scenario, Expected Solution, Steps] – Analytical or scenario-based decision-making' }
];

@Injectable({
  providedIn: 'root'
})
export class AiService {
  
  constructor() {}

  async generateStructuredPrompt(userInput: string, format: 'markdown' | 'json' | 'xml' | 'text', frameworkId: PromptFramework): Promise<string> {
    const selectedFramework = frameworkOptions.find(f => f.id === frameworkId);
    const frameworkInstruction = selectedFramework && selectedFramework.id !== 'standard'
      ? `You MUST structure the generated prompt according to the "${selectedFramework.name}" framework. Ensure the final prompt has clear sections corresponding to this framework.`
      : 'You will generate a standard, high-quality prompt based on the user input.';

    const formatInstructions = {
      text: `The generated prompt must be in plain text format. The output must be ONLY the plain text prompt, without any surrounding text or explanatory phrases.`,
      markdown: `The generated prompt MUST be valid Markdown. Use Markdown syntax for structure and clarity: use '#', '##' for headings, '*' or '-' for bullet points, and '**' for bolding key terms. The final output must be ONLY the raw Markdown content. Do NOT wrap the output in a markdown code block (\`\`\`).`,
      json: `The generated prompt MUST be a valid JSON object. The final output must be ONLY the raw JSON string. Do not wrap it in markdown code blocks like \`\`\`json ... \`\`\`. The top-level key MUST be descriptive and based on the user's request (e.g., 'socialMediaCalendar'). It must be a valid JSON object that can be parsed directly.`,
      xml: `The generated prompt MUST be valid XML. The final output must be ONLY the raw XML string. Do not wrap it in markdown code blocks like \`\`\`xml ... \`\`\`. The root element MUST be descriptive and based on the user's request (e.g., '<recipeRequest>'). Do not include any text before the opening XML tag.`
    };

    try {
      // Call our secure Netlify Function instead of the Groq API directly
      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
          format,
          frameworkId,
          frameworkInstruction, // Pass the constructed instructions to the backend
          formatInstructions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.prompt || '';
    } catch (error) {
      console.error('Error calling backend function:', error);
      throw new Error(`Failed to generate prompt: ${error.message}`);
    }
  }
}