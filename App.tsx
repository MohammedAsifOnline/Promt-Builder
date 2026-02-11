import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LanguageSelector from './components/LanguageSelector';
import OutputCard from './components/OutputCard';
import { InputMode, GeminiResponse, PromptType, Theme } from './types';
import { SUPPORTED_LANGUAGES, MAX_WORDS } from './constants';
import { generatePromptAndTranslation } from './services/geminiService';

// Fix: Add type definitions for SpeechRecognition API to fix TypeScript errors
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onstart: (() => void) | null;
    start: () => void;
    stop: () => void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}


const MicIcon = ({ isRecording }: { isRecording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${isRecording ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const App: React.FC = () => {
    const [inputMode, setInputMode] = useState<InputMode>(InputMode.TEXT);
    const [promptType, setPromptType] = useState<PromptType>(PromptType.STANDARD);
    const [userInput, setUserInput] = useState<string>('');
    const [wordCount, setWordCount] = useState<number>(0);
    const [targetLanguage, setTargetLanguage] = useState<string>('none');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [output, setOutput] = useState<GeminiResponse | null>(null);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || Theme.SYSTEM);


    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const words = userInput.trim().split(/\s+/).filter(Boolean);
        setWordCount(words.length);
    }, [userInput]);

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = () => {
            if (theme === Theme.LIGHT) {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else if (theme === Theme.DARK) {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else { // SYSTEM
                localStorage.setItem('theme', 'system');
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === Theme.SYSTEM) {
                applyTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    
    const handleVoiceInput = useCallback(() => {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            setError('Speech recognition is not supported by your browser.');
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; 

        let finalTranscript = '';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setUserInput(userInput + finalTranscript + interimTranscript);
        };
        
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event) => setError(`Speech recognition error: ${event.error}`);

        recognition.start();
        recognitionRef.current = recognition;
        
    }, [isRecording, userInput]);


    const handleSubmit = async () => {
        if (!userInput.trim()) {
            setError('Please enter your idea first.');
            return;
        }
        if (wordCount > MAX_WORDS) {
            setError(`Input cannot exceed ${MAX_WORDS} words.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutput(null);

        try {
            const result = await generatePromptAndTranslation(userInput, targetLanguage, promptType);
            setOutput(result);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Header theme={theme} setTheme={setTheme} />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Panel */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Your Idea</h2>
                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                               <button onClick={() => setInputMode(InputMode.TEXT)} className={`px-3 py-1 text-sm rounded-md transition-colors ${inputMode === InputMode.TEXT ? 'bg-white dark:bg-gray-900 shadow text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>Text</button>
                               <button onClick={() => setInputMode(InputMode.VOICE)} className={`px-3 py-1 text-sm rounded-md transition-colors ${inputMode === InputMode.VOICE ? 'bg-white dark:bg-gray-900 shadow text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>Voice</button>
                            </div>
                        </div>

                        {inputMode === InputMode.TEXT ? (
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Type or paste your idea here..."
                                className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            />
                        ) : (
                           <div className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50">
                               <button onClick={handleVoiceInput} className="flex flex-col items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                                  <MicIcon isRecording={isRecording} />
                                  <span className={`text-sm font-medium ${isRecording ? 'animate-pulse text-red-500' : ''}`}>
                                      {isRecording ? 'Recording... Click to Stop' : 'Click to Record'}
                                  </span>
                               </button>
                               {isRecording && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Live transcript will appear in the text area below.</p>}
                               <textarea
                                  value={userInput}
                                  readOnly
                                  className="w-full h-20 mt-2 p-2 bg-white dark:bg-gray-800 border-t dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300"
                                  placeholder="Voice input will appear here..."
                               />
                           </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>Word Count: {wordCount} / {MAX_WORDS}</span>
                            {wordCount > MAX_WORDS && <span className="text-red-500 font-medium">Limit Exceeded</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Type:</label>
                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <button onClick={() => setPromptType(PromptType.STANDARD)} className={`w-full py-2 text-sm rounded-md transition-colors ${promptType === PromptType.STANDARD ? 'bg-white dark:bg-gray-900 shadow text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>Standard</button>
                                <button onClick={() => setPromptType(PromptType.CONSTRUCTIVE)} className={`w-full py-2 text-sm rounded-md transition-colors ${promptType === PromptType.CONSTRUCTIVE ? 'bg-white dark:bg-gray-900 shadow text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>Constructive</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Translate to:</label>
                            <LanguageSelector selectedLanguage={targetLanguage} onChange={setTargetLanguage} />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || wordCount === 0 || wordCount > MAX_WORDS}
                            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Brush Up Idea & Generate Prompt 🎯'
                            )}
                        </button>
                    </div>

                    {/* Output Panel */}
                    <div className="space-y-6">
                        {error && <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-lg">{error}</div>}
                        
                        {isLoading && !output && (
                            <div className="space-y-4">
                                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            </div>
                        )}

                        {output && (
                            <>
                                <div className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-md">
                                    <strong>Detected Language:</strong> {output.detectedLanguage}
                                </div>
                                <OutputCard 
                                    title={`Refined ${promptType === PromptType.CONSTRUCTIVE ? 'Constructive' : 'Standard'} English Prompt`}
                                    content={output.constructiveEnglishPrompt}
                                    borderColor="border-blue-400 dark:border-blue-500"
                                    titleColor="text-blue-600 dark:text-blue-400"
                                />
                                {targetLanguage !== 'none' && output.translatedPrompt && (
                                  <OutputCard 
                                      title={`Translated Prompt (${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name})`} 
                                      content={output.translatedPrompt}
                                      borderColor="border-purple-400 dark:border-purple-500"
                                      titleColor="text-purple-600 dark:text-purple-400"
                                  />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default App;
