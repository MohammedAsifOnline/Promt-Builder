export enum InputMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export enum PromptType {
  STANDARD = 'STANDARD',
  CONSTRUCTIVE = 'CONSTRUCTIVE',
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system',
}

export interface Language {
  code: string;
  name: string;
}

export interface GeminiResponse {
  detectedLanguage: string;
  constructiveEnglishPrompt: string;
  translatedPrompt: string;
}
