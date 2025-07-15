import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';

interface MainContentProps {
  children: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { darkMode } = useStudioStore();
  
  return (
    <div 
      className={`flex-1 flex flex-col min-h-0 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ height: '100%' }}
    >
      {children}
    </div>
  );
}; 