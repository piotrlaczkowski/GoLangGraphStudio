import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStudioStore } from '../../store/useStudioStore';
import { Assistant, ViewMode } from '../../types';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  CommandLineIcon, 
  CogIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const {
    assistants,
    selectedAssistant,
    setSelectedAssistant,
    currentView,
    setCurrentView,
    darkMode,
    setDarkMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    config,
    isConnected,
    fetchGraphData,
    connectionStatus,
    retryAttempts,
    maxRetryAttempts,
    attemptReconnection
  } = useStudioStore();

  const [assistantDropdownOpen, setAssistantDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const isDemoMode = config.apiUrl.includes('localhost:3000');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setAssistantDropdownOpen(false);
      }
    };

    if (assistantDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [assistantDropdownOpen]);

  // Update dropdown position when it opens
  useEffect(() => {
    if (assistantDropdownOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8, // 8px gap below button
          left: rect.left,
          width: rect.width
        });
      };

      updatePosition();

      // Update position on scroll and resize
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [assistantDropdownOpen]);

  const handleSelectAssistant = async (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setAssistantDropdownOpen(false);

    // Fetch graph data for the selected assistant if connected to real server
    if (!isDemoMode) {
      try {
        await fetchGraphData(assistant.id);
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
      }
    }
  };

  const views: { key: ViewMode; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'graph', label: 'Graph', icon: CommandLineIcon },
    { key: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
    { key: 'debug', label: 'Debug', icon: CogIcon },
  ];

  return (
    <header className={`h-16 flex items-center justify-between px-6 border-b backdrop-blur-sm transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-800/95 border-gray-700 text-white' 
        : 'bg-white/95 border-gray-200 text-gray-900'
    }`}>
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
        >
          {sidebarCollapsed ? (
            <Bars3Icon className="w-5 h-5" />
          ) : (
            <XMarkIcon className="w-5 h-5" />
          )}
        </button>

        {/* Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            darkMode ? 'bg-blue-600' : 'bg-blue-600'
          }`}>
            <span className="text-white font-bold text-sm">LS</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">LangGraph Studio</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isDemoMode ? 'Demo Mode' : 'Connected'}
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <nav className={`flex items-center space-x-1 rounded-xl p-1 ml-6 ${
          darkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          {views.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === key
                  ? darkMode
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                    : 'bg-white text-blue-600 shadow-md transform scale-105'
                  : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Center Section - Assistant Selector */}
      <div className="flex-1 flex justify-center">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setAssistantDropdownOpen(!assistantDropdownOpen)}
            className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-all duration-200 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            }`}
            ref={buttonRef}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-blue-600' : 'bg-blue-100'
            }`}>
              <CogIcon className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">
                {selectedAssistant?.name || 'Select Assistant'}
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedAssistant?.description || 'No assistant selected'}
              </div>
            </div>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${
              assistantDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Assistant Dropdown */}
          {assistantDropdownOpen && createPortal(
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-[999998] bg-black/10"
                onClick={() => setAssistantDropdownOpen(false)}
              />
              
              {/* Dropdown */}
              <div 
                ref={dropdownRef}
                className={`fixed rounded-xl border shadow-2xl z-[999999] ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`} 
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: Math.max(dropdownPosition.width, 320),
                  maxHeight: '400px'
                }}
              >
                <div className="p-2 max-h-80 overflow-y-auto">
                  {assistants.length === 0 ? (
                    <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <CogIcon className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className="text-sm">No assistants available</p>
                      <p className="text-xs mt-1">
                        {isDemoMode ? 'Create an assistant to get started' : 'Check your server connection'}
                      </p>
                    </div>
                  ) : (
                    assistants.map((assistant) => (
                      <button
                        key={assistant.id}
                        onClick={() => handleSelectAssistant(assistant)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          selectedAssistant?.id === assistant.id
                            ? darkMode 
                              ? 'bg-blue-900 border border-blue-700' 
                              : 'bg-blue-50 border border-blue-200'
                            : darkMode 
                              ? 'hover:bg-gray-700' 
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedAssistant?.id === assistant.id
                            ? darkMode ? 'bg-blue-600' : 'bg-blue-600'
                            : darkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <CogIcon className={`w-4 h-4 ${
                            selectedAssistant?.id === assistant.id ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {assistant.name}
                          </div>
                          {assistant.description && (
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {assistant.description}
                            </div>
                          )}
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Graph: {assistant.graph_id}
                          </div>
                        </div>
                        {selectedAssistant?.id === assistant.id && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
            connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-spin' :
            connectionStatus === 'failed' ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'reconnecting' ? `Reconnecting (${retryAttempts}/${maxRetryAttempts})` :
             connectionStatus === 'failed' ? 'Connection Failed' : 'Disconnected'}
          </span>
          {(connectionStatus === 'disconnected' || connectionStatus === 'failed') && (
            <button
              onClick={attemptReconnection}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                darkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title="Retry Connection"
            >
              Retry
            </button>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-yellow-400' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>

        {/* Keyboard Shortcuts Hint */}
        <div className={`text-xs px-2 py-1 rounded ${
          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}>
          ⌘1-3 to switch views
        </div>
      </div>
    </header>
  );
}; 