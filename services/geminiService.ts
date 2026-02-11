import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse, PromptType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    detectedLanguage: {
      type: Type.STRING,
      description: "The language detected from the user's input text.",
    },
    constructiveEnglishPrompt: {
      type: Type.STRING,
      description: "A refined, constructive, and polished prompt in English based on the user's core idea. The format should match the requested prompt type (Standard or Constructive).",
    },
    translatedPrompt: {
      type: Type.STRING,
      description: "The translation of the constructive English prompt into the specified target language. If no translation is requested, this should be an empty string.",
    },
  },
  required: ["detectedLanguage", "constructiveEnglishPrompt", "translatedPrompt"],
};

const getSystemInstruction = (promptType: PromptType, targetLanguage: string): string => {
    const translationTask = targetLanguage === 'none'
        ? "4. Do not perform any translation. The 'translatedPrompt' field in the JSON output must be an empty string."
        : "4. Translate ONLY the generated constructive English prompt into the specified target language, ensuring the translation sounds natural and fluent, as a native speaker would say it.";

    if (promptType === PromptType.CONSTRUCTIVE) {
        return `You are an AI-powered multilingual creative assistant. Your goal is to transform a user's raw idea into a highly structured, constructive English prompt and then translate it if requested.
        Tasks:
        1. Detect the input language of the user's idea.
        2. Understand the core idea.
        3. Generate a refined, constructive English prompt using the following Markdown format:
        ## **Role:**
        (Define the role the AI should assume for this task.)
        ## **Objective:**
        (Clearly state the goal or outcome expected.)
        ## **Context:**
        (Provide background, scenario, or constraints for the task.)
        ## **Instructions:**
        ### **Instruction 1 :** (First actionable step based on user’s intent)
        ### **Instruction 2 :** (Second actionable step)
        ### **Instruction 3 :** (Third actionable step)
        ## **Notes:**
        - Add clarifications, assumptions, or constraints here.
        - Keep output in Markdown format.
        - Expand steps or notes if required.
        ${translationTask}
        Ensure your tone is clear, creative, and helpful. The output must be a valid JSON object matching the provided schema.`;
    }

    // Standard Prompt Instruction
    return `You are an AI-powered multilingual creative assistant. Your goal is to transform a user's raw idea into a polished, standard English prompt and then translate it if requested.
    Tasks:
    1. Detect the input language of the user's idea.
    2. Understand and summarize the core idea.
    3. Generate a refined, simple, and actionable English prompt based on that idea.
    ${translationTask}
    Ensure your tone is clear, creative, and helpful. The output must be a valid JSON object matching the provided schema.`;
}


export const generatePromptAndTranslation = async (
  userInput: string,
  targetLanguage: string,
  promptType: PromptType,
): Promise<GeminiResponse> => {
  try {
    const systemInstruction = getSystemInstruction(promptType, targetLanguage);

    const contents = targetLanguage === 'none'
      ? `User Idea: "${userInput}"`
      : `User Idea: "${userInput}"\nTarget Language for Translation: "${targetLanguage}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText) as GeminiResponse;
    return parsedResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate prompt: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the prompt.");
  }
};
