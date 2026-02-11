import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);


interface OutputCardProps {
  title: string;
  content: string;
  borderColor?: string;
  titleColor?: string;
}

const OutputCard: React.FC<OutputCardProps> = ({ title, content, borderColor = 'border-gray-200 dark:border-gray-700', titleColor = 'text-gray-600 dark:text-gray-300' }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setIsCopied(true);
    }
  };

  return (
    <div className={`relative rounded-lg border bg-white dark:bg-gray-800 shadow-sm ${borderColor}`}>
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${titleColor}`}>{title}</h3>
        <IconButton
            icon={isCopied ? <CheckIcon /> : <CopyIcon />}
            text={isCopied ? 'Copied!' : 'Copy'}
            onClick={handleCopy}
            disabled={!content}
            className={`transition-all duration-200 ${isCopied ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
        />
      </div>
      <div className="p-4 min-h-[100px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{content}</div>
    </div>
  );
};

export default OutputCard;
