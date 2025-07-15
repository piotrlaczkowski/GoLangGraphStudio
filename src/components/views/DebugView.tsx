import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { format } from 'date-fns';

export const DebugView: React.FC = () => {
  const { currentRun, graphState, selectedThread, darkMode } = useStudioStore();
  const [activeTab, setActiveTab] = useState<'state' | 'steps' | 'logs' | 'performance'>('state');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'>('ALL');

  const mockState = {
    messages: selectedThread?.messages || [],
    current_node: graphState.currentNode || 'agent',
    execution_path: graphState.executionPath,
    variables: {
      user_input: "What is LangGraph?",
      context: "LangGraph is a library for building stateful, multi-actor applications with LLMs.",
      step_count: 3,
      tools_used: ["search", "reasoning"],
      session_data: {
        user_id: "user_123",
        session_id: "sess_456",
        start_time: new Date().toISOString(),
      }
    },
    metadata: {
      session_id: "session_123",
      timestamp: new Date().toISOString(),
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2048,
      total_tokens: 1247,
    }
  };

  const mockSteps = [
    {
      id: "step_1",
      node: "start",
      status: "completed",
      input: { message: "What is LangGraph?" },
      output: { processed: true, routing_decision: "agent" },
      timestamp: new Date(Date.now() - 5000),
      duration: 120,
      tokens_used: 45,
    },
    {
      id: "step_2", 
      node: "agent",
      status: "running",
      input: { query: "What is LangGraph?", context: "user_question" },
      output: null,
      timestamp: new Date(Date.now() - 3000),
      duration: null,
      tokens_used: 0,
    },
    {
      id: "step_3",
      node: "tools",
      status: "pending",
      input: null,
      output: null,
      timestamp: null,
      duration: null,
      tokens_used: 0,
    }
  ];

  const mockLogs = [
    {
      level: "INFO",
      message: "Graph execution started successfully",
      timestamp: new Date(Date.now() - 5000),
      node: "start",
      details: { session_id: "sess_123", user_id: "user_456" }
    },
    {
      level: "DEBUG", 
      message: "Processing user input with content filtering",
      timestamp: new Date(Date.now() - 4500),
      node: "start",
      details: { input_length: 18, filtered: false }
    },
    {
      level: "INFO",
      message: "Transitioning to agent node based on routing logic",
      timestamp: new Date(Date.now() - 4000),
      node: "agent",
      details: { routing_score: 0.95, confidence: "high" }
    },
    {
      level: "DEBUG",
      message: "Agent reasoning process initiated with context",
      timestamp: new Date(Date.now() - 3500),
      node: "agent",
      details: { context_tokens: 234, reasoning_mode: "analytical" }
    },
    {
      level: "WARN",
      message: "Tool execution taking longer than expected threshold",
      timestamp: new Date(Date.now() - 2000),
      node: "agent",
      details: { expected_ms: 1000, current_ms: 2500 }
    },
    {
      level: "ERROR",
      message: "Rate limit approaching for external API calls",
      timestamp: new Date(Date.now() - 1000),
      node: "tools",
      details: { remaining_calls: 5, reset_time: "2024-01-01T12:00:00Z" }
    }
  ];

  const mockPerformance = {
    total_execution_time: 4200,
    node_performance: [
      { node: "start", avg_duration: 120, calls: 15, total_time: 1800 },
      { node: "agent", avg_duration: 2100, calls: 12, total_time: 25200 },
      { node: "tools", avg_duration: 800, calls: 8, total_time: 6400 },
      { node: "end", avg_duration: 50, calls: 10, total_time: 500 },
    ],
    memory_usage: {
      current: "245 MB",
      peak: "312 MB",
      average: "198 MB"
    },
    token_usage: {
      total: 1247,
      input: 892,
      output: 355,
      cost_estimate: "$0.0234"
    }
  };

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.node.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = logLevel === 'ALL' || log.level === logLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Modern Header with Gradient */}
      <div className={`relative overflow-hidden ${
        darkMode 
          ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800' 
          : 'bg-gradient-to-r from-blue-50 via-white to-purple-50'
      }`}>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Debug Console
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time graph execution monitoring and analysis
                </p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700/50' : 'bg-white/50'
              } backdrop-blur-sm`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Live
                </span>
              </div>
              <div className={`px-3 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700/50' : 'bg-white/50'
              } backdrop-blur-sm`}>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {mockSteps.filter(s => s.status === 'completed').length}/{mockSteps.length} Steps
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'state', label: 'State', icon: '🔍', count: Object.keys(mockState.variables).length },
              { id: 'steps', label: 'Steps', icon: '📋', count: mockSteps.length },
              { id: 'logs', label: 'Logs', icon: '📝', count: filteredLogs.length },
              { id: 'performance', label: 'Performance', icon: '⚡', count: mockPerformance.node_performance.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative py-4 px-1 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? darkMode 
                      ? 'text-blue-400 border-b-2 border-blue-400' 
                      : 'text-blue-600 border-b-2 border-blue-500'
                    : darkMode 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id
                      ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                      : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'state' && <StateView state={mockState} darkMode={darkMode} />}
        {activeTab === 'steps' && <StepsView steps={mockSteps} darkMode={darkMode} />}
        {activeTab === 'logs' && (
          <LogsView 
            logs={filteredLogs} 
            darkMode={darkMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            logLevel={logLevel}
            setLogLevel={setLogLevel}
          />
        )}
        {activeTab === 'performance' && <PerformanceView performance={mockPerformance} darkMode={darkMode} />}
      </div>
    </div>
  );
};

const StateView: React.FC<{ state: any; darkMode: boolean }> = ({ state, darkMode }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['variables']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Execution Overview */}
        <div className={`rounded-xl border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Execution Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current Node</div>
              <div className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {state.current_node}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Steps Completed</div>
              <div className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {state.execution_path.length}
              </div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Messages</div>
              <div className={`text-xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {state.messages.length}
              </div>
            </div>
          </div>
        </div>

        {/* Execution Path */}
        <div className={`rounded-xl border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Execution Path
          </h3>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {state.execution_path.map((node: string, index: number) => (
              <React.Fragment key={node}>
                <div className={`flex items-center px-4 py-2 rounded-lg border-2 ${
                  darkMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${
                    darkMode ? 'bg-blue-500' : 'bg-blue-200'
                  }`}>
                    {index + 1}
                  </span>
                  {node}
                </div>
                {index < state.execution_path.length - 1 && (
                  <svg className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Variables Section */}
        <div className={`rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('variables')}
            className={`w-full p-6 text-left flex items-center justify-between ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            } transition-colors rounded-t-xl`}
          >
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Variables ({Object.keys(state.variables).length})
            </h3>
            <svg 
              className={`w-5 h-5 transition-transform ${
                expandedSections.has('variables') ? 'rotate-90' : ''
              } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {expandedSections.has('variables') && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(state.variables).map(([key, value]) => (
                  <div key={key} className={`rounded-lg p-4 border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {key}
                    </div>
                    <div className={`text-sm font-mono p-3 rounded ${
                      darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                    } max-h-32 overflow-y-auto custom-scrollbar`}>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Section */}
        <div className={`rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('metadata')}
            className={`w-full p-6 text-left flex items-center justify-between ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            } transition-colors rounded-t-xl`}
          >
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Metadata
            </h3>
            <svg 
              className={`w-5 h-5 transition-transform ${
                expandedSections.has('metadata') ? 'rotate-90' : ''
              } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {expandedSections.has('metadata') && (
            <div className="px-6 pb-6">
              <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <pre className={`text-sm font-mono whitespace-pre-wrap ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {JSON.stringify(state.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StepsView: React.FC<{ steps: any[]; darkMode: boolean }> = ({ steps, darkMode }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'running': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'error': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getDarkStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'running': return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'error': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-800 border-gray-600';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-4">
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(step.id);
          const statusColors = darkMode ? getDarkStatusColor(step.status) : getStatusColor(step.status);
          
          return (
            <div key={step.id} className={`rounded-xl border transition-all duration-200 ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            } hover:shadow-lg`}>
              <button
                onClick={() => toggleStep(step.id)}
                className={`w-full p-6 text-left ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                } transition-colors rounded-t-xl`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                      darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {step.node}
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Step ID: {step.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors}`}>
                      {step.status}
                    </div>
                    {step.duration && (
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {step.duration}ms
                      </div>
                    )}
                    <svg 
                      className={`w-5 h-5 transition-transform ${
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
              </button>

              {isExpanded && (
                <div className={`px-6 pb-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {step.input && (
                      <div>
                        <h5 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Input Data
                        </h5>
                        <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <pre className={`text-sm font-mono whitespace-pre-wrap ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {step.output && (
                      <div>
                        <h5 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Output Data
                        </h5>
                        <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <pre className={`text-sm font-mono whitespace-pre-wrap ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step Metrics */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Timestamp</div>
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {step.timestamp ? format(step.timestamp, 'HH:mm:ss.SSS') : 'Pending'}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration</div>
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {step.duration ? `${step.duration}ms` : 'N/A'}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tokens Used</div>
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {step.tokens_used || 0}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</div>
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {step.status}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LogsView: React.FC<{ 
  logs: any[]; 
  darkMode: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  logLevel: string;
  setLogLevel: (level: any) => void;
}> = ({ logs, darkMode, searchTerm, setSearchTerm, logLevel, setLogLevel }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return darkMode ? 'text-red-400 bg-red-900/30' : 'text-red-700 bg-red-50';
      case 'WARN': return darkMode ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-700 bg-yellow-50';
      case 'INFO': return darkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-700 bg-blue-50';
      case 'DEBUG': return darkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-700 bg-gray-100';
      default: return darkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter Bar */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="ALL">All Levels</option>
            <option value="ERROR">Error</option>
            <option value="WARN">Warning</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-3">
          {logs.map((log, index) => (
            <div key={index} className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`px-2 py-1 rounded text-xs font-bold ${getLevelColor(log.level)}`}>
                  {log.level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {log.message}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {format(log.timestamp, 'HH:mm:ss.SSS')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {log.node}
                    </span>
                  </div>
                  {log.details && (
                    <div className={`mt-3 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <pre className={`text-xs font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PerformanceView: React.FC<{ performance: any; darkMode: boolean }> = ({ performance, darkMode }) => {
  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-6 rounded-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Execution</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {performance.total_execution_time}ms
            </div>
          </div>
          <div className={`p-6 rounded-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Memory Usage</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {performance.memory_usage.current}
            </div>
          </div>
          <div className={`p-6 rounded-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Tokens</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {performance.token_usage.total}
            </div>
          </div>
          <div className={`p-6 rounded-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cost Estimate</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {performance.token_usage.cost_estimate}
            </div>
          </div>
        </div>

        {/* Node Performance */}
        <div className={`rounded-xl border p-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Node Performance
          </h3>
          <div className="space-y-4">
            {performance.node_performance.map((node: any) => (
              <div key={node.node} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{node.node}</h4>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {node.calls} calls
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Duration</div>
                    <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {node.avg_duration}ms
                    </div>
                  </div>
                  <div>
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Time</div>
                    <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {node.total_time}ms
                    </div>
                  </div>
                  <div>
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Efficiency</div>
                    <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {Math.round((node.total_time / performance.total_execution_time) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Memory and Token Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-xl border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Memory Usage
            </h3>
            <div className="space-y-3">
              {Object.entries(performance.memory_usage).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>
                    {key.replace('_', ' ')}
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-xl border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Token Usage
            </h3>
            <div className="space-y-3">
              {Object.entries(performance.token_usage).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>
                    {key.replace('_', ' ')}
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 