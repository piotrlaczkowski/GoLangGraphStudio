import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Thread } from '../../types';
import { PlusIcon, ChatBubbleLeftIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export const Sidebar: React.FC = () => {
  const {
    threads,
    selectedThread,
    setSelectedThread,
    addThread,
    deleteThread,
    darkMode
  } = useStudioStore();

  const createNewThread = () => {
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      name: `Thread ${threads.length + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addThread(newThread);
    setSelectedThread(newThread);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteThread(threadId);
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-colors duration-300`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftIcon className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Threads
            </h2>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            {threads.length}
          </div>
        </div>
        
        <button
          onClick={createNewThread}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
            darkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
          }`}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Thread
        </button>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {threads.length === 0 ? (
          <div className={`p-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <ChatBubbleLeftIcon className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No threads yet
            </h3>
            <p className="text-xs leading-relaxed">
              Create your first thread to start a conversation with your assistant
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedThread?.id === thread.id
                    ? darkMode 
                      ? 'bg-blue-900/50 border-2 border-blue-600 shadow-lg' 
                      : 'bg-blue-50 border-2 border-blue-200 shadow-md'
                    : darkMode 
                      ? 'hover:bg-gray-700 border-2 border-transparent hover:border-gray-600' 
                      : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                }`}
              >
                {/* Thread Content */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className={`text-sm font-semibold truncate ${
                        selectedThread?.id === thread.id
                          ? darkMode ? 'text-blue-300' : 'text-blue-700'
                          : darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {thread.name}
                      </h3>
                      {thread.messages.length > 0 && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          selectedThread?.id === thread.id
                            ? darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700'
                            : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {thread.messages.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Last Message Preview */}
                    {thread.messages.length > 0 ? (
                      <p className={`text-xs line-clamp-2 mb-2 ${
                        selectedThread?.id === thread.id
                          ? darkMode ? 'text-blue-400' : 'text-blue-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {thread.messages[thread.messages.length - 1].content}
                      </p>
                    ) : (
                      <p className={`text-xs italic mb-2 ${
                        selectedThread?.id === thread.id
                          ? darkMode ? 'text-blue-400' : 'text-blue-600'
                          : darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        No messages yet
                      </p>
                    )}
                    
                    {/* Timestamp */}
                    <div className={`flex items-center space-x-1 text-xs ${
                      selectedThread?.id === thread.id
                        ? darkMode ? 'text-blue-400' : 'text-blue-600'
                        : darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <ClockIcon className="w-3 h-3" />
                      <span>{format(thread.updatedAt, 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200 ${
                      darkMode 
                        ? 'hover:bg-red-900 text-gray-400 hover:text-red-300' 
                        : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                    }`}
                    title="Delete thread"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Selection Indicator */}
                {selectedThread?.id === thread.id && (
                  <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full ${
                    darkMode ? 'bg-blue-400' : 'bg-blue-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {threads.length > 0 && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {threads.length} thread{threads.length !== 1 ? 's' : ''} • 
            {threads.reduce((acc, thread) => acc + thread.messages.length, 0)} total messages
          </div>
        </div>
      )}
    </div>
  );
}; 