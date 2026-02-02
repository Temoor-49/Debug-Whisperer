
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Difficulty, DebugResponse, UserProfile, PreventionResponse, DetectiveResponse } from "../types";

/**
 * Helper to initialize the GenAI client.
 * This ensures we're always pulling the latest API Key from the environment
 * and avoids top-level initialization issues during the build phase.
 */
const getAIClient = () => {
  // Fix: Initialize GoogleGenAI strictly using process.env.API_KEY as per the GenAI coding guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeErrorInitial = async (
  input: { text?: string; imageBase64?: string; mimeType?: string },
  profile?: UserProfile
): Promise<string> => {
  const ai = getAIClient();
  const parts: any[] = [];
  
  const profileContext = profile ? `
  User Profile:
  - Preferred Language: ${profile.preferredLanguage}
  - Experience Level: ${profile.experienceLevel}
  - Frameworks: ${profile.frameworks}
  ` : '';

  if (input.imageBase64 && input.mimeType) {
    parts.push({
      inlineData: {
        data: input.imageBase64,
        mimeType: input.mimeType
      }
    });
    parts.push({ text: `Transcribe the error message from this image and explain it in 2-3 sentences using plain English and NO jargon. Be encouraging. ${profileContext}` });
  } else if (input.text) {
    parts.push({ text: `You are DebugWhisperer, a friendly coding tutor. ${profileContext} 
    Explain this error message in 2-3 sentences using plain English and NO jargon. Be encouraging. 
    Error: ${input.text}` });
  } else {
    throw new Error("No input provided");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      temperature: 0.7,
    }
  });
  return response.text || "I'm having a little trouble reading that. Could you try again?";
};

export const formatCodeSnippet = async (
  code: string,
  language: string
): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Format the following ${language} code according to industry-standard conventions (e.g., Prettier for JS/TS, PEP8 for Python). 
    Return ONLY the formatted code. Do not include markdown backticks or explanations.
    
    Code:
    ${code}`,
    config: {
      temperature: 0.1,
    }
  });
  return response.text?.trim() || code;
};

export const elaborateCodeExplanation = async (
  code: string,
  language: string,
  difficulty: Difficulty
): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As an expert coding tutor, provide an elaborate, step-by-step breakdown of this ${language} code fix. 
    Tailor the explanation for a ${difficulty} level developer.
    Explain the reasoning behind each significant block.
    Use Markdown with clear bullet points.
    
    Code:
    ${code}`,
    config: {
      temperature: 0.7,
    }
  });
  return response.text || "I couldn't generate a detailed breakdown right now.";
};

export const createSolutionChat = (
  difficulty: Difficulty,
  profile?: UserProfile
): Chat => {
  const ai = getAIClient();
  const profileContext = profile ? `
  User Context:
  - Preferred Language: ${profile.preferredLanguage}
  - Primary Frameworks: ${profile.frameworks}
  ` : '';

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are DebugWhisperer, a friendly coding tutor. 
      You help people understand error messages and provide step-by-step fixes.
      Current Difficulty Level: ${difficulty}. 
      ${profileContext}
      
      Always return your response in JSON format matching this schema:
      {
        "chatResponse": "string (A friendly conversational message addressing the user's latest query)",
        "whatWentWrong": "string (A simple summary of the current error context)",
        "whyItHappened": "string (The root cause explained for the chosen difficulty)",
        "howToFixIt": "string (The step-by-step instructional steps to fix it. Use Markdown formatting)",
        "codeSnippet": "string (The code block to fix the error, if applicable)",
        "codeExplanation": "string (A concise breakdown of what the codeSnippet is doing)",
        "language": "string (The programming language)",
        "proTip": "string (Optional helpful insight)",
        "tags": ["string"] (2-3 short tags)
      }`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chatResponse: { type: Type.STRING },
          whatWentWrong: { type: Type.STRING },
          whyItHappened: { type: Type.STRING },
          howToFixIt: { type: Type.STRING },
          codeSnippet: { type: Type.STRING },
          codeExplanation: { type: Type.STRING },
          language: { type: Type.STRING },
          proTip: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["chatResponse", "whatWentWrong", "whyItHappened", "howToFixIt", "tags"]
      }
    }
  });
};

export const sendMessageToChat = async (
  chat: Chat,
  message: string
): Promise<DebugResponse> => {
  const result = await chat.sendMessage({ message });
  return JSON.parse(result.text || '{}') as DebugResponse;
};

export const analyzePrevention = async (
  code: string,
  profile?: UserProfile
): Promise<PreventionResponse> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this code for potential runtime errors or logical failures. 
    Code: ${code}

    Perform step-by-step reasoning. Return JSON matching the PreventionResponse interface.`,
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reasoning: { type: Type.STRING },
          language: { type: Type.STRING },
          autoPatch: { type: Type.STRING },
          predictions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                errorType: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                trigger: { type: Type.STRING },
                because: { type: Type.STRING },
                fix: { type: Type.STRING },
              },
              required: ["severity", "errorType", "probability", "trigger", "because", "fix"]
            }
          }
        },
        required: ["reasoning", "predictions", "autoPatch", "language"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const analyzeDetective = async (
  filesContent: string,
  profile?: UserProfile
): Promise<DetectiveResponse> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are DebugWhisperer in DETECTIVE MODE. Analyze the following project files and trace the error chain backwards from manifestation to root cause.
    
    Files:
    ${filesContent}

    Return a JSON object with:
    1. chain: Array of link objects { file, line, description, type: "origin"|"propagation"|"manifestation" }
    2. rootCause: { file, line, explanation }
    3. affectedFiles: string[]
    4. rippleEffects: string (summary of what else breaks)
    5. strategy: string (multi-file fix strategy)
    6. fileFixes: Array of { file, description, originalSnippet, fixedSnippet }`,
    config: {
      thinkingConfig: { thinkingBudget: 8000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chain: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                file: { type: Type.STRING },
                line: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["origin", "propagation", "manifestation"] }
              },
              required: ["file", "line", "description", "type"]
            }
          },
          rootCause: {
            type: Type.OBJECT,
            properties: {
              file: { type: Type.STRING },
              line: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["file", "line", "explanation"]
          },
          affectedFiles: { type: Type.ARRAY, items: { type: Type.STRING } },
          rippleEffects: { type: Type.STRING },
          strategy: { type: Type.STRING },
          fileFixes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                file: { type: Type.STRING },
                description: { type: Type.STRING },
                originalSnippet: { type: Type.STRING },
                fixedSnippet: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateSolution = async (
  error: string, 
  explanation: string, 
  difficulty: Difficulty,
  profile?: UserProfile
): Promise<DebugResponse> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Solution for error: ${error}. Initial: ${explanation}. Difficulty: ${difficulty}. 
    Return JSON matching DebugResponse.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          whatWentWrong: { type: Type.STRING },
          whyItHappened: { type: Type.STRING },
          howToFixIt: { type: Type.STRING },
          codeSnippet: { type: Type.STRING },
          codeExplanation: { type: Type.STRING },
          language: { type: Type.STRING },
          proTip: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["whatWentWrong", "whyItHappened", "howToFixIt", "tags"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
