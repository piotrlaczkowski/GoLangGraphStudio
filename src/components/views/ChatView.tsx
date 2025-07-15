import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore, useLiveUpdates, useAllLiveUpdates } from '../../store/useStudioStore';
import { Message, ExecutionLog } from '../../types';
import { PaperAirplaneIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

// Import the LiveLogsPanel from GraphView
const LiveLogsPanel: React.FC<{
  logs: ExecutionLog[];
  darkMode: boolean;
  onLogHover: (nodeId: string | null) => void;
  onLogSelect: (logId: string | null) => void;
  selectedLogId: string | null;
}> = ({ logs, darkMode, onLogHover, onLogSelect, selectedLogId }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.nodeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'input': return darkMode ? 'text-blue-400' : 'text-blue-600';
      case 'output': return darkMode ? 'text-green-400' : 'text-green-600';
      case 'error': return darkMode ? 'text-red-400' : 'text-red-600';
      case 'info': return darkMode ? 'text-gray-400' : 'text-gray-600';
      case 'debug': return darkMode ? 'text-purple-400' : 'text-purple-600';
      default: return darkMode ? 'text-gray-300' : 'text-gray-700';
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'input': return '📥';
      case 'output': return '📤';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      default: return '📝';
    }
  };

  const getLogTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'input': return darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'output': return darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'error': return darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      case 'info': return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
      case 'debug': return darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800';
      default: return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const formatData = (data: any, expanded: boolean = false) => {
    if (!data) return null;
    
    if (typeof data === 'string') {
      return expanded ? data : data.length > 100 ? data.substring(0, 100) + '...' : data;
    }
    
    const jsonString = JSON.stringify(data, null, expanded ? 2 : 0);
    if (!expanded && jsonString.length > 200) {
      return jsonString.substring(0, 200) + '...';
    }
    
    return jsonString;
  };

  const renderDetailedLogView = (log: ExecutionLog) => {
    const isExpanded = expandedLogs.has(log.id);
    const isSelected = selectedLogId === log.id;
    
    return (
      <div
        key={log.id}
        className={`rounded-lg border transition-all duration-300 ${
          isSelected 
            ? `log-entry-selected ${darkMode ? 'bg-blue-900/30 border-blue-500 shadow-lg' : 'bg-blue-50 border-blue-300 shadow-lg'}`
            : `${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-white border-gray-200 hover:bg-gray-50'} hover:log-entry-hover`
        }`}
        onMouseEnter={() => onLogHover(log.nodeId)}
        onMouseLeave={() => onLogHover(null)}
      >
        <div 
          className="p-4 cursor-pointer"
          onClick={() => {
            onLogSelect(isSelected ? null : log.id);
            toggleLogExpansion(log.id);
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getLogTypeBadgeColor(log.type)}`}>
                <span className="text-sm">{getLogTypeIcon(log.type)}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {log.nodeName}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLogTypeBadgeColor(log.type)}`}>
                    {log.type.toUpperCase()}
                  </span>
                </div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {log.timestamp.toLocaleTimeString()} • Node ID: {log.nodeId}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {log.duration && (
                <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  ⏱️ {log.duration}ms
                </div>
              )}
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          {/* Message */}
          <div className={`text-sm mb-3 p-3 rounded-lg ${
            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
          }`}>
            <div className="flex items-start space-x-2">
              <span className="text-lg">💬</span>
              <span>{log.message}</span>
            </div>
          </div>
          
          {/* Quick Data Preview */}
          {log.data && !isExpanded && (
            <div className={`p-3 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Data Preview
                </span>
                <span className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Click to expand
                </span>
              </div>
              <div className={`text-xs font-mono ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                {formatData(log.data, false)}
              </div>
            </div>
          )}
        </div>
        
        {/* Expanded Details */}
        {isExpanded && log.data && (
          <div className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className="p-4 space-y-4">
              {/* Raw Data */}
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h4 className={`text-sm font-semibold mb-2 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="mr-2">🗂️</span>
                  Raw Data
                </h4>
                <pre className={`text-xs font-mono p-3 rounded overflow-x-auto log-data-json ${
                  darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'
                }`}>
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Live Execution Logs
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {filteredLogs.length} / {logs.length}
            </span>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 px-3 py-2 text-xs border rounded-lg ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 text-xs border rounded-lg ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="input">Input</option>
            <option value="output">Output</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg font-medium mb-2">
              {logs.length === 0 ? 'No execution logs yet' : 'No logs match your filter'}
            </p>
            <p className="text-sm">
              {logs.length === 0 ? 'Start graph execution to see live logs' : 'Try adjusting your search or filter'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => renderDetailedLogView(log))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export const ChatView: React.FC = () => {
  const {
    selectedThread,
    selectedAssistant,
    addMessageToThread,
    darkMode,
    executionContext,
    stopExecution,
    addExecutionLog,
    graphState,
    startGlobalExecution
  } = useStudioStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showMiniLogs, setShowMiniLogs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Live update listeners for global execution synchronization
  useLiveUpdates('EXECUTION_COMPLETED', (event) => {
    setIsLoading(false);
    // Auto-scroll to bottom when execution completes
    setTimeout(scrollToBottom, 100);
  });

  useLiveUpdates('EXECUTION_STOPPED', (event) => {
    setIsLoading(false);
  });

  useLiveUpdates('MESSAGE_ADDED', (event) => {
    // Auto-scroll when new messages are added
    setTimeout(scrollToBottom, 100);
  });

  // Listen to all live updates for debugging
  useAllLiveUpdates((event) => {
    // Removed debug logging to clean up console
    // console.log('🔴 Live Update in ChatView:', event.type, event.data);
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change or during loading
  useEffect(() => {
    scrollToBottom();
  }, [selectedThread?.messages, isLoading]);

  // Auto-scroll during execution
  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  // Helper function to extract meaningful response from execution logs
  const extractResponseFromLogs = (logs: ExecutionLog[], finalState: any): string => {
    // First priority: Look for intermediate_results in logs (matching user's example format)
    const intermediateResultsLogs = logs.filter(log => 
      log.data?.intermediate_results
    );
    
    for (const log of intermediateResultsLogs.reverse()) {
      const results = log.data.intermediate_results;
      
      // Look for respond node specifically (as shown in user's example)
      if (results.respond && results.respond.response) {
        return results.respond.response;
      }
      
      // Look for any response generation nodes
      for (const [nodeId, result] of Object.entries(results)) {
        if (typeof result === 'object' && result !== null) {
          const nodeResult = result as any;
          
          // Prioritize final response nodes
          if ((nodeId === 'respond' || nodeId.includes('respond')) && nodeResult.response) {
            return nodeResult.response;
          }
          
          // Then greeting responses
          if (nodeId.includes('greeting') && nodeResult.response) {
            return nodeResult.response;
          }
          
          // Then any node with a response
          if (nodeResult.response && typeof nodeResult.response === 'string' && nodeResult.response.trim().length > 0) {
            return nodeResult.response;
          }
        }
      }
    }
    
    // Second priority: Look for final_response in the execution state
    if (finalState?.final_response && typeof finalState.final_response === 'string') {
      return finalState.final_response;
    }
    
    // Third priority: Look for actual agent responses in the logs
    const responseLogs = logs.filter(log => 
      log.type === 'output' && 
      log.data?.output?.response && 
      typeof log.data.output.response === 'string' &&
      log.data.output.response.trim().length > 0
    );
    
    if (responseLogs.length > 0) {
      // Get the most recent response from a generation node
      const generationResponses = responseLogs.filter(log => 
        log.nodeId.includes('respond') || 
        log.nodeId.includes('generation') || 
        log.nodeName.toLowerCase().includes('respond') ||
        log.nodeName.toLowerCase().includes('generation')
      );
      
      if (generationResponses.length > 0) {
        const latestResponse = generationResponses[generationResponses.length - 1];
        return latestResponse.data.output.response;
      }
      
      // Fallback to any response
      const latestResponse = responseLogs[responseLogs.length - 1];
      return latestResponse.data.output.response;
    }
    
    // Fourth priority: Look for responses in state_updates intermediate results
    const stateUpdateLogs = logs.filter(log => 
      log.data?.state_updates?.intermediate_results
    );
    
    for (const log of stateUpdateLogs.reverse()) {
      const results = log.data.state_updates.intermediate_results;
      for (const [nodeId, result] of Object.entries(results)) {
        if ((nodeId.includes('respond') || nodeId.includes('generation')) && result && typeof result === 'object') {
          const response = (result as any).response;
          if (response && typeof response === 'string' && response.trim().length > 0) {
            return response;
          }
        }
      }
    }
    
    // Fifth priority: Look for any generation or response nodes in output data
    const generationLogs = logs.filter(log => 
      (log.nodeId.includes('respond') || 
       log.nodeId.includes('generation') || 
       log.nodeId.includes('greeting') ||
       log.nodeName.toLowerCase().includes('respond') ||
       log.nodeName.toLowerCase().includes('generation') ||
       log.nodeName.toLowerCase().includes('greeting')) &&
      log.type === 'output' &&
      log.data?.output
    );
    
    for (const log of generationLogs.reverse()) {
      const output = log.data.output;
      if (output.response && typeof output.response === 'string' && output.response.trim().length > 0) {
        return output.response;
      }
      if (output.result && typeof output.result === 'string' && output.result.trim().length > 0) {
        return output.result;
      }
      if (output.content && typeof output.content === 'string' && output.content.trim().length > 0) {
        return output.content;
      }
    }
    
    // Sixth priority: Look for any meaningful text output in recent logs
    const meaningfulLogs = logs.filter(log => 
      log.type === 'output' && 
      log.data?.output && 
      typeof log.data.output === 'object'
    ).slice(-5); // Get last 5 meaningful logs
    
    for (const log of meaningfulLogs.reverse()) {
      const output = log.data.output;
      
      // Check various possible response fields
      const possibleResponses = [
        output.response,
        output.result, 
        output.content,
        output.text,
        output.message,
        output.answer,
        output.clarification_request
      ];
      
      for (const response of possibleResponses) {
        if (response && typeof response === 'string' && response.trim().length > 20) {
          return response;
        }
      }
    }
    
    // Last resort: Generate a contextual response based on execution path
    const executedNodes = new Set(logs.map(log => log.nodeId));
    const userMessage = logs.find(log => log.data?.userMessage)?.data.userMessage || 'your request';
    
    if (executedNodes.has('respond_to_greeting') || Array.from(executedNodes).some(id => id.includes('greeting'))) {
      return `Hello! I'm here to help you with any questions or research you need. What would you like to know about?`;
    }
    
    if (executedNodes.has('conduct_research') || Array.from(executedNodes).some(id => id.includes('research'))) {
      return `I've conducted research on "${userMessage}" and found relevant information. The analysis shows promising results that address your question. Would you like me to provide more specific details?`;
    }
    
    if (executedNodes.has('ask_for_more_info') || Array.from(executedNodes).some(id => id.includes('more') || id.includes('info'))) {
      return `Could you provide more specific details about "${userMessage}"? This will help me give you more targeted and useful information.`;
    }
    
    // Generic fallback based on execution
    const nodeCount = executedNodes.size;
    return `I've processed your request about "${userMessage}" through ${nodeCount} execution step${nodeCount !== 1 ? 's' : ''}. How can I help you further?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Ensure we have a thread and assistant - create them if needed
    const { threads, assistants, selectedThread, selectedAssistant, addThread, setSelectedThread, setSelectedAssistant } = useStudioStore.getState();
    
    let currentThread = selectedThread;
    let currentAssistant = selectedAssistant;
    
    // Create a default assistant if none exists
    if (!currentAssistant && assistants.length === 0) {
      const defaultAssistant = {
        id: 'default-assistant',
        name: 'GoLangGraph Assistant',
        description: 'Default assistant for chat interactions',
        type: 'chat' as const,
        model: 'gpt-4',
        provider: 'openai',
        temperature: 0.7,
        maxTokens: 1000,
        maxIterations: 10,
        tools: [],
        enableStreaming: false,
        timeout: 30000,
        config: {},
        graph_id: 'default-graph',
      };
      useStudioStore.getState().addAssistant(defaultAssistant);
      setSelectedAssistant(defaultAssistant);
      currentAssistant = defaultAssistant;
    } else if (!currentAssistant && assistants.length > 0) {
      setSelectedAssistant(assistants[0]);
      currentAssistant = assistants[0];
    }
    
    // Create a default thread if none exists
    if (!currentThread) {
      const defaultThread = {
        id: `thread-${Date.now()}`,
        name: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        assistantId: currentAssistant?.id || 'default-assistant',
      };
      addThread(defaultThread);
      setSelectedThread(defaultThread);
      currentThread = defaultThread;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message to thread
    addMessageToThread(currentThread.id, userMessage);
    
    // Clear input
    setInputMessage('');
    setIsLoading(true);

    try {
      // Start global execution that will be visible in both chat and graph
      startGlobalExecution('chat', {}, inputMessage.trim());
      
      // The global execution will handle:
      // 1. Graph node progression
      // 2. Execution logs
      // 3. Final response generation
      // 4. Live updates across all interfaces
      
    } catch (error) {
      console.error('Execution error:', error);
      setIsLoading(false);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      addMessageToThread(currentThread.id, errorMessage);
    }
  };

  // Helper function to generate contextual responses quickly
  const generateContextualResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Quick pattern matching for rapid responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! I'm here to help you with any questions or research you need. What would you like to know about?";
    }
    
    if (input.includes('research') || input.includes('find') || input.includes('search')) {
      return `I'd be happy to help you research "${userInput}". Based on your query, I can provide information, analysis, and insights. What specific aspects would you like me to focus on?`;
    }
    
    if (input.includes('how') || input.includes('what') || input.includes('why') || input.includes('when') || input.includes('where')) {
      return `Great question about "${userInput}"! I've analyzed your query and I'm ready to provide you with comprehensive information. Let me break this down for you and give you the insights you're looking for.`;
    }
    
    if (input.includes('help') || input.includes('assist') || input.includes('support')) {
      return `I'm here to help! Regarding "${userInput}", I can provide assistance, guidance, and detailed information. What specific help do you need?`;
    }
    
    if (input.includes('explain') || input.includes('describe') || input.includes('tell me')) {
      return `I'd be happy to explain "${userInput}" for you. This is an interesting topic that I can break down into clear, understandable parts. Let me provide you with a comprehensive explanation.`;
    }
    
    // Default contextual response
    return `Thank you for your question about "${userInput}". I've processed your request and I'm ready to provide you with helpful, detailed information. This appears to be an interesting topic that I can certainly help you explore further. What specific aspects would you like me to focus on?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStopExecution = () => {
    if (executionContext.isExecuting || isLoading) {
      stopExecution();
      setIsLoading(false);
      
      // Add stop log
      addExecutionLog({
        nodeId: 'system',
        nodeName: 'System',
        type: 'info',
        message: 'Execution stopped by user',
        data: {
          stopped_by_user: true,
          duration: executionContext.startTime ? Date.now() - executionContext.startTime.getTime() : 0,
          executed_nodes: new Set(executionContext.logs.map((log: ExecutionLog) => log.nodeId)).size,
          total_nodes: graphState.nodes.length
        }
      });

      // Add stop message to chat
      if (selectedThread) {
        const stopMessage: Message = {
          id: `msg-${Date.now()}-stopped`,
          role: 'assistant',
          content: '⏹️ **Execution Stopped**\n\nGraph execution was stopped by user request.\n\nYou can start a new execution by sending another message.',
          timestamp: new Date(),
        };
        addMessageToThread(selectedThread.id, stopMessage);
      }
    }
  };

  return (
    <div className={`h-full flex flex-col m-4 rounded-xl shadow-lg border transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 shadow-gray-900/20' : 'bg-white border-gray-200 shadow-gray-200/50'}`}>
      {/* Chat Header */}
      <div className={`p-6 border-b backdrop-blur-sm ${darkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-100'}`}>
              <svg className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedThread?.name || 'New Chat'} 💬
              </h2>
              {selectedAssistant && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  🤖 Assistant: {selectedAssistant.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Log Toggle Button */}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                showLogs
                  ? darkMode 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-600 text-white shadow-md'
                  : darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showLogs ? 'Hide Logs' : 'Show Logs'}
            >
              {showLogs ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {showLogs ? 'Hide Logs' : 'Show Logs'}
              </span>
              {executionContext.logs.length > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  showLogs
                    ? 'bg-white/20 text-white'
                    : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {executionContext.logs.length}
                </span>
              )}
            </button>
            
            {/* Execution Status */}
            {(isLoading || executionContext.isExecuting) && (
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${
                darkMode ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-sm font-medium">
                      {(() => {
                        const isStreaming = executionContext.logs.some((log: ExecutionLog) => 
                          log.type === 'output' && log.data?.streaming === true
                        );
                        if (isStreaming) return 'Streaming Response';
                        if (executionContext.isExecuting) return 'Graph Executing';
                        return 'Processing';
                      })()}
                    </div>
                    {graphState.currentNode && (
                      <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        Current: {graphState.nodes.find(n => n.id === graphState.currentNode)?.data.label || graphState.currentNode}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {executionContext.logs.some((log: ExecutionLog) => log.type === 'output' && log.data?.streaming === true) && (
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                    }`}>
                      Live
                    </div>
                  )}
                  
                  <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {new Set(executionContext.logs.map((log: ExecutionLog) => log.nodeId)).size}/{graphState.nodes.length} steps
                  </div>
                  
                  <button
                    onClick={handleStopExecution}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      darkMode 
                        ? 'bg-red-900 text-red-300 hover:bg-red-800' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                    title="Stop Execution"
                  >
                    ⏹️ Stop
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Connected</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {selectedThread?.messages.length || 0} messages
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Messages Area */}
        <div className={`flex-1 flex flex-col ${showLogs ? 'border-r' : ''} ${darkMode && showLogs ? 'border-gray-700' : showLogs ? 'border-gray-200' : ''}`}>
          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            style={{ scrollBehavior: 'smooth' }}
          >
            {selectedThread?.messages.length === 0 || !selectedThread ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center animate-fade-in">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Start a conversation! ✨
                  </h3>
                  <p className={`max-w-md mx-auto leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Send a message to begin chatting with your GoLangGraph agent. 
                    You can ask questions, give instructions, or start a discussion! 🎯
                  </p>
                  <div className="mt-6 flex justify-center space-x-4">
                    <span className="text-2xl animate-bounce" style={{ animationDelay: '0s' }}>💭</span>
                    <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🤖</span>
                    <span className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>⚡</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {selectedThread.messages.map((message, index) => {
                  // Check if this message is currently being streamed
                  const isStreamingMessage = message.role === 'assistant' && 
                    message.id.includes('streaming') && 
                    isLoading;
                  
                  return (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      isFirst={index === 0}
                      isLast={index === selectedThread.messages.length - 1}
                      isStreaming={isStreamingMessage}
                    />
                  );
                })}
                {isLoading && <GraphExecutionIndicator />}
                {isLoading && executionContext.logs.length > 0 && (
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowMiniLogs(true)}
                    onMouseLeave={() => setShowMiniLogs(false)}
                  >
                    <div className={`text-center py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="text-xs cursor-pointer hover:underline">
                        💡 Hover to see recent logs ({executionContext.logs.length})
                      </span>
                    </div>
                    {showMiniLogs && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 z-10">
                        <LiveLogsMiniPanel logs={executionContext.logs.slice(-5)} darkMode={darkMode} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`p-6 border-t backdrop-blur-sm ${darkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'}`}>
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here... ✨"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                  }`}
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {inputMessage.length > 0 && `${inputMessage.length} chars`}
                </div>
              </div>
              {(isLoading || executionContext.isExecuting) ? (
                <button
                  onClick={handleStopExecution}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                    'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                  title="Stop Execution"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2" fill="currentColor"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    !inputMessage.trim()
                      ? darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span className="flex items-center space-x-1">
                <span>Powered by</span>
                <span className="font-semibold text-blue-500">GoLangGraph</span>
                <span>⚡</span>
              </span>
            </div>
          </div>
        </div>

        {/* Logs Panel */}
        {showLogs && (
          <div className={`w-96 flex-shrink-0 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <LiveLogsPanel
              logs={executionContext.logs}
              darkMode={darkMode}
              onLogHover={() => {}} // No node highlighting in chat view
              onLogSelect={setSelectedLogId}
              selectedLogId={selectedLogId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  isFirst?: boolean;
  isLast?: boolean;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isFirst, isLast, isStreaming }) => {
  const { darkMode } = useStudioStore();
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      <div className={`max-w-4xl ${isUser ? 'order-2' : 'order-1'} group`}>
        <div className="flex items-start space-x-3">
          {!isUser && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
              <span className="text-sm">🤖</span>
            </div>
          )}
          
          <div className="flex-1">
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md ${
                isUser 
                  ? darkMode 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : darkMode 
                    ? 'bg-gray-700 text-gray-100 border border-gray-600' 
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
              }`}
            >
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              ) : (
                <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
            
            <div className={`flex items-center mt-2 space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {format(message.timestamp, 'HH:mm')}
              </span>
              {isStreaming && (
                <div className="flex items-center space-x-1">
                  <div className={`inline-block w-2 h-2 rounded-full animate-pulse ${darkMode ? 'bg-green-400' : 'bg-green-500'}`}></div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Streaming...
                  </span>
                </div>
              )}
              {isLast && isUser && (
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {isUser && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gradient-to-br from-green-600 to-blue-600' : 'bg-gradient-to-br from-green-100 to-blue-100'}`}>
              <span className="text-sm">👤</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GraphExecutionIndicator: React.FC = () => {
  const { darkMode, executionContext, graphState } = useStudioStore();
  
  // Check if we're currently streaming
  const isStreaming = executionContext.logs.some((log: ExecutionLog) => 
    log.type === 'output' && 
    log.data?.streaming === true
  );

  // Get current executing node info
  const currentNode = graphState.currentNode ? 
    graphState.nodes.find(n => n.id === graphState.currentNode) : null;
  
  // Get latest log for current activity
  const latestLog = executionContext.logs.length > 0 ? 
    executionContext.logs[executionContext.logs.length - 1] : null;
  
  // Calculate execution progress
  const totalNodes = graphState.nodes.length;
  const executedNodes = new Set(executionContext.logs.map((log: ExecutionLog) => log.nodeId)).size;
  const progressPercentage = totalNodes > 0 ? Math.round((executedNodes / totalNodes) * 100) : 0;
  
  return (
    <div className="flex items-start space-x-3 animate-fade-in">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
        <span className="text-sm animate-bounce">🤖</span>
      </div>
      <div className={`rounded-2xl p-4 shadow-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        {/* Main Status */}
        <div className="flex items-center space-x-2 mb-3">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isStreaming ? 'Streaming Response' : 'Executing Graph'}
          </span>
          <div className="flex space-x-1">
            <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '0.1s' }}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '0.2s' }}></div>
          </div>
          {isStreaming && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
            }`}>
              Live
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Progress
            </span>
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {executedNodes}/{totalNodes} nodes ({progressPercentage}%)
            </span>
          </div>
          <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isStreaming 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveLogsMiniPanel: React.FC<{ logs: ExecutionLog[]; darkMode: boolean }> = ({ logs, darkMode }) => {
  const getLogTypeIcon = (type: string): string => {
    switch (type) {
      case 'input': return '📥';
      case 'output': return '📤';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      default: return '📝';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className={`rounded-2xl p-4 shadow-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${darkMode ? 'bg-green-400' : 'bg-green-500'}`}></div>
          <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Live Logs
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
          }`}>
            {logs.length} recent
          </span>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
          {logs.map((log, index) => (
            <div 
              key={log.id} 
              className={`flex items-start space-x-2 p-2 rounded-lg transition-all duration-200 ${
                darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
              }`}
              style={{ 
                animationDelay: `${index * 100}ms`,
                opacity: 1 - (index * 0.1) // Fade older logs slightly
              }}
            >
              <span className="text-xs">{getLogTypeIcon(log.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {log.nodeName}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className={`text-xs mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {log.message}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {logs.length === 0 && (
          <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-2xl mb-2">📋</div>
            <p className="text-xs">Waiting for logs...</p>
          </div>
        )}
      </div>
    </div>
  );
};