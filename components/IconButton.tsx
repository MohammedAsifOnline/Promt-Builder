import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  text: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, text, ...props }) => {
  return (
    <button
      {...props}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};

export default IconButton;
