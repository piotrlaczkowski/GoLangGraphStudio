import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudioStore } from '../../store/useStudioStore';
import { GoLangGraphConfig } from '../../types';
import toast from 'react-hot-toast';

interface HealthStatus {
  status: 'idle' | 'checking' | 'success' | 'error';
  message: string;
  lastChecked?: Date;
}

interface AvailableGraph {
  id: string;
  name: string;
  description?: string;
  config?: any;
}

export const ConnectionSetup: React.FC = () => {
  const navigate = useNavigate();
  const { setConfig, setIsConnected, setIsLoading, addAssistant, clearAssistants, fetchGraphData, darkMode } = useStudioStore();
  const [formData, setFormData] = useState<GoLangGraphConfig>({
    apiUrl: 'http://127.0.0.1:8080',
    agentId: '',
    apiKey: '',
  });
  
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'idle',
    message: 'Enter server URL to check connectivity'
  });
  
  const [availableGraphs, setAvailableGraphs] = useState<AvailableGraph[]>([]);
  const [isLoadingGraphs, setIsLoadingGraphs] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);

  // Debounced health check when URL changes
  const checkHealth = useCallback(async (url: string) => {
    if (!url || !url.startsWith('http')) {
      setHealthStatus({
        status: 'idle',
        message: 'Enter a valid server URL'
      });
      setShowGraphs(false);
      return;
    }

    setHealthStatus({
      status: 'checking',
      message: 'Checking server connectivity...'
    });

    try {
      const healthUrl = `${url}/ok`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setHealthStatus({
          status: 'success',
          message: 'Server is online and accessible',
          lastChecked: new Date()
        });
        
        // Fetch available graphs
        await fetchAvailableGraphs(url);
        setTimeout(() => setShowGraphs(true), 300);
      } else {
        setHealthStatus({
          status: 'error',
          message: `Server responded with status: ${response.status}`,
          lastChecked: new Date()
        });
        setShowGraphs(false);
      }
    } catch (error: any) {
      let message = 'Connection failed';
      if (error.name === 'AbortError') {
        message = 'Connection timeout - server not responding';
      } else if (error.message.includes('fetch')) {
        message = 'Cannot reach server - check URL and network';
      }
      
      setHealthStatus({
        status: 'error',
        message,
        lastChecked: new Date()
      });
      setShowGraphs(false);
    }
  }, []);

  const fetchAvailableGraphs = async (url: string) => {
    setIsLoadingGraphs(true);
    try {
      const response = await fetch(`${url}/assistants/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {},
          limit: 100,
          offset: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Available graphs:', data);
        
        // Handle different response formats
        let graphs: AvailableGraph[] = [];
        if (Array.isArray(data)) {
          graphs = data.map((item: any) => ({
            id: item.assistant_id || item.id || item.graph_id || item.name,
            name: item.name || item.assistant_id || item.id || item.graph_id,
            description: item.description || `Assistant: ${item.assistant_id || item.id || item.name}`,
            config: item.config || {}
          }));
        } else if (data.assistants && Array.isArray(data.assistants)) {
          graphs = data.assistants.map((item: any) => ({
            id: item.assistant_id || item.id || item.graph_id || item.name,
            name: item.name || item.assistant_id || item.id || item.graph_id,
            description: item.description || `Assistant: ${item.assistant_id || item.id || item.name}`,
            config: item.config || {}
          }));
        } else if (data.graphs && Array.isArray(data.graphs)) {
          graphs = data.graphs.map((item: any) => ({
            id: item.assistant_id || item.id || item.graph_id || item.name,
            name: item.name || item.assistant_id || item.id || item.graph_id,
            description: item.description || `Assistant: ${item.assistant_id || item.id || item.name}`,
            config: item.config || {}
          }));
        }

        setAvailableGraphs(graphs);
        
        // Auto-select first graph if none selected
        if (graphs.length > 0 && !formData.assistantId) {
          setFormData(prev => ({ ...prev, assistantId: graphs[0].id }));
        }
      } else {
        // Fallback to default graphs if endpoint doesn't exist
        const defaultGraphs = [
          { id: 'retrieval_graph', name: 'Retrieval Graph', description: 'RAG-based retrieval assistant' },
          { id: 'researcher_graph', name: 'Research Graph', description: 'Multi-step research assistant' },
          { id: 'chat_agent', name: 'Chat Agent', description: 'Conversational AI assistant' },
          { id: 'indexer', name: 'Indexer', description: 'Document indexing graph' }
        ];
        setAvailableGraphs(defaultGraphs);
      }
    } catch (error) {
      console.log('Could not fetch graphs, using defaults');
      const defaultGraphs = [
        { id: 'retrieval_graph', name: 'Retrieval Graph', description: 'RAG-based retrieval assistant' },
        { id: 'researcher_graph', name: 'Research Graph', description: 'Multi-step research assistant' },
        { id: 'chat_agent', name: 'Chat Agent', description: 'Conversational AI assistant' },
        { id: 'indexer', name: 'Indexer', description: 'Document indexing graph' }
      ];
      setAvailableGraphs(defaultGraphs);
    } finally {
      setIsLoadingGraphs(false);
    }
  };

  // Debounced URL change effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.apiUrl) {
        checkHealth(formData.apiUrl);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [formData.apiUrl, checkHealth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (healthStatus.status !== 'success') {
      toast.error('Please ensure the server connection is healthy before connecting');
      return;
    }

    if (!formData.assistantId) {
      toast.error('Please select a graph to use');
      return;
    }

    setIsConnecting(true);
    setIsLoading(true);

    try {
      // Final connection test
      const response = await fetch(`${formData.apiUrl}/ok`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        // Clear any existing demo data
        clearAssistants();
        
        setConfig(formData);
        setIsConnected(true);
        
        // Try to fetch actual assistants from the server
        try {
          console.log('🔍 Fetching assistants from server...');
          const assistantsResponse = await fetch(`${formData.apiUrl}/assistants/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(formData.apiKey && { 'X-Api-Key': formData.apiKey })
            },
            body: JSON.stringify({
              metadata: {},
              limit: 100,
              offset: 0
            })
          });
          
          if (assistantsResponse.ok) {
            const serverAssistants = await assistantsResponse.json();
            console.log('📋 Server assistants:', serverAssistants);
            
            // Add server assistants to our store
            if (Array.isArray(serverAssistants) && serverAssistants.length > 0) {
              serverAssistants.forEach(assistant => {
                addAssistant({
                  id: assistant.assistant_id || assistant.id,
                  name: assistant.name || assistant.assistant_id || assistant.id,
                  description: assistant.description || '',
                  config: assistant.config || {},
                  graph_id: assistant.graph_id || assistant.id,
                });
              });
              
              // Use the first available assistant for graph data
              const firstAssistant = serverAssistants[0];
              const assistantId = firstAssistant.assistant_id || firstAssistant.id;
              console.log(`✅ Using assistant: ${assistantId}`);
              
              // Fetch the actual graph data for the first available assistant
              await fetchGraphData(assistantId);
            } else {
              console.warn('⚠️ No assistants found on server, using fallback');
              // Fallback: Add available graphs as assistants (original behavior)
              availableGraphs.forEach(graph => {
                addAssistant({
                  id: graph.id,
                  name: graph.name,
                  description: graph.description || '',
                  config: graph.config || {},
                  graph_id: graph.id,
                });
              });
            }
          } else {
            console.warn('⚠️ Could not fetch assistants, using available graphs as fallback');
            // Fallback: Add available graphs as assistants (original behavior)
            availableGraphs.forEach(graph => {
              addAssistant({
                id: graph.id,
                name: graph.name,
                description: graph.description || '',
                config: graph.config || {},
                graph_id: graph.id,
              });
            });
          }
        } catch (assistantError) {
          console.warn('⚠️ Error fetching assistants, using available graphs as fallback:', assistantError);
          // Fallback: Add available graphs as assistants (original behavior)
          availableGraphs.forEach(graph => {
            addAssistant({
              id: graph.id,
              name: graph.name,
              description: graph.description || '',
              config: graph.config || {},
              graph_id: graph.id,
            });
          });
        }
        
        toast.success('Successfully connected to LangGraph server!');
        
        // Navigate to studio after successful connection
        setTimeout(() => {
          navigate('/studio');
        }, 500);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect to LangGraph server. Please check your configuration.');
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LangGraphConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDemoMode = () => {
    console.log('Demo mode activated');
    
    // Set demo configuration
    const demoConfig = {
      apiUrl: 'http://localhost:3000', // Demo mode
      assistantId: 'demo_graph',
      apiKey: '',
    };
    
    setConfig(demoConfig);
    
    // Add demo assistants
    const demoAssistants = [
      {
        id: 'demo_graph',
        name: 'Demo Assistant',
        description: 'A sample assistant for demonstration',
        config: {},
        graph_id: 'demo_graph',
      },
      {
        id: 'retrieval_graph',
        name: 'Retrieval Assistant',
        description: 'RAG-based retrieval assistant',
        config: {},
        graph_id: 'retrieval_graph',
      },
      {
        id: 'researcher_graph',
        name: 'Research Assistant',
        description: 'Multi-step research assistant',
        config: {},
        graph_id: 'researcher_graph',
      }
    ];
    
    demoAssistants.forEach(assistant => addAssistant(assistant));
    
    // Set connected state
    setIsConnected(true);
    
    // Show success message
    toast.success('Demo mode activated! Explore the interface with sample data.');
    
    // Navigate to studio
    setTimeout(() => {
      navigate('/studio');
    }, 500);
  };

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'checking':
        return (
          <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    switch (healthStatus.status) {
      case 'checking': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDarkStatusColor = () => {
    switch (healthStatus.status) {
      case 'checking': return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'success': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'error': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-800 border-gray-600';
    }
  };

  return (
    <div className={`min-h-screen w-full flex ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
          darkMode ? 'bg-blue-600' : 'bg-blue-400'
        }`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse delay-1000 ${
          darkMode ? 'bg-purple-600' : 'bg-purple-400'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse delay-500 ${
          darkMode ? 'bg-indigo-600' : 'bg-indigo-400'
        }`}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-center items-center p-12 relative">
          <div className="max-w-md text-center animate-slide-in-left">
            <div className={`w-32 h-32 rounded-3xl flex items-center justify-center mx-auto mb-8 ${
              darkMode 
                ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600' 
                : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600'
            } shadow-2xl animate-pulse-glow`}>
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h1 className={`text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              LangGraph
              <span className={`block text-4xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Studio
              </span>
            </h1>
            
            <p className={`text-xl leading-relaxed mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Build, debug, and deploy intelligent agent workflows with visual graph execution
            </p>

            <div className="space-y-4">
              <div className={`flex items-center space-x-3 p-4 rounded-xl ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/50'
              } backdrop-blur-sm`}>
                <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Real-time graph execution
                </span>
              </div>
              <div className={`flex items-center space-x-3 p-4 rounded-xl ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/50'
              } backdrop-blur-sm`}>
                <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} animate-pulse delay-300`}></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Interactive debugging tools
                </span>
              </div>
              <div className={`flex items-center space-x-3 p-4 rounded-xl ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/50'
              } backdrop-blur-sm`}>
                <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-500'} animate-pulse delay-700`}></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Multi-agent orchestration
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Setup Form */}
        <div className="w-full lg:w-1/2 xl:w-3/5 flex items-center justify-center p-6 lg:p-12">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl backdrop-blur-md border ${
            darkMode 
              ? 'bg-gray-800/80 border-gray-700' 
              : 'bg-white/80 border-gray-200'
          } animate-slide-in-right`}>
            
            {/* Header */}
            <div className="p-8 text-center">
              <div className="lg:hidden mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                  darkMode 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                } shadow-lg`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              
              <h2 className={`text-2xl lg:text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Get Started
              </h2>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Connect to your server or try demo mode
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Server URL with Health Status */}
                <div className="animate-fade-in-up stagger-1">
                  <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Server URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.apiUrl}
                      onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                      placeholder="http://127.0.0.1:2024"
                      className={`w-full px-4 py-4 pr-14 border rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500'
                      } backdrop-blur-sm`}
                      required
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {getStatusIcon()}
                    </div>
                  </div>
                  
                  {/* Health Status Indicator */}
                  <div className={`mt-3 p-4 rounded-xl border text-sm flex items-center space-x-3 transition-all duration-300 ${
                    darkMode ? getDarkStatusColor() : getStatusColor()
                  }`}>
                    {getStatusIcon()}
                    <div className="flex-1">
                      <span className="font-medium">{healthStatus.message}</span>
                      {healthStatus.lastChecked && (
                        <div className="text-xs opacity-75 mt-1">
                          Last checked: {healthStatus.lastChecked.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Available Graphs */}
                {showGraphs && (
                  <div className="animate-fade-in-up stagger-2">
                    <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Available Graphs
                      {isLoadingGraphs && (
                        <span className="ml-2 text-xs text-blue-500">
                          <svg className="inline w-3 h-3 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      )}
                    </label>
                    
                    {availableGraphs.length > 0 ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                        {availableGraphs.map((graph, index) => (
                          <label
                            key={graph.id}
                            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                              formData.assistantId === graph.id
                                ? darkMode
                                  ? 'bg-blue-900/40 border-blue-500 text-blue-400 shadow-lg'
                                  : 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg'
                                : darkMode
                                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 text-gray-200'
                                  : 'bg-white/50 border-gray-200 hover:bg-gray-50 text-gray-700'
                            } animate-slide-in-right`}
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <input
                              type="radio"
                              name="assistantId"
                              value={graph.id}
                              checked={formData.assistantId === graph.id}
                              onChange={(e) => handleInputChange('assistantId', e.target.value)}
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <div className="font-semibold">{graph.name}</div>
                              {graph.description && (
                                <div className={`text-sm mt-1 ${
                                  formData.assistantId === graph.id
                                    ? 'opacity-90'
                                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {graph.description}
                                </div>
                              )}
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              formData.assistantId === graph.id
                                ? 'border-current scale-110'
                                : darkMode ? 'border-gray-500' : 'border-gray-300'
                            }`}>
                              {formData.assistantId === graph.id && (
                                <div className="w-3 h-3 rounded-full bg-current animate-pulse"></div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-6 rounded-xl border text-center ${
                        darkMode ? 'bg-gray-700/50 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        {isLoadingGraphs ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading graphs...</span>
                          </div>
                        ) : (
                          'No graphs available. Check server connection.'
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 animate-fade-in-up stagger-3">
                  <button
                    type="submit"
                    disabled={healthStatus.status !== 'success' || !formData.assistantId || isConnecting}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform ${
                      healthStatus.status === 'success' && formData.assistantId && !isConnecting
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-lg hover:shadow-2xl'
                        : 'bg-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isConnecting ? (
                      <div className="flex items-center justify-center space-x-3">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      'Connect to Server'
                    )}
                  </button>

                  <div className={`relative flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="absolute inset-0 flex items-center">
                      <div className={`w-full border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                    </div>
                    <div className={`relative px-4 text-sm font-medium ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      or
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemoMode}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      darkMode
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                    } shadow-lg hover:shadow-2xl`}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-xl">🚀</span>
                      <span>Try Demo Mode</span>
                    </div>
                  </button>
                </div>
              </form>

              {/* Quick Info */}
              <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'} animate-fade-in-up stagger-4`}>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-2xl mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>🚀</div>
                    <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Demo Mode
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No setup needed
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-2xl mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>🔗</div>
                    <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Server Mode
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Real execution
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 