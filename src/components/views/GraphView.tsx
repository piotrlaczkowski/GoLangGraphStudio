import React, { useEffect, useState, useRef } from 'react';
import { useStudioStore, useLiveUpdates, useAllLiveUpdates } from '../../store/useStudioStore';
import { GraphNode, GraphEdge, ExecutionLog, GraphExecutionState, Message } from '../../types';

// Define StudioGraphNode type to include position
type StudioGraphNode = GraphNode & { position: { x: number; y: number } };

// Node Log Tooltip Component
const NodeLogTooltip: React.FC<{
  nodeId: string;
  logs: ExecutionLog[];
  darkMode: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}> = ({ nodeId, logs, darkMode, position, onClose }) => {
  const nodeLogs = logs.filter(log => log.nodeId === nodeId);
  
  if (nodeLogs.length === 0) return null;
  
  const latestLog = nodeLogs[nodeLogs.length - 1];
  
  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: position.x + 20, 
        top: position.y - 10,
        maxWidth: '400px'
      }}
    >
      <div className={`rounded-lg shadow-xl border p-4 pointer-events-auto ${
        darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Node Execution Details</h4>
          <button 
            onClick={onClose}
            className={`text-xs px-2 py-1 rounded ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Latest Execution
            </div>
            <div className="text-sm">{latestLog.message}</div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {latestLog.timestamp.toLocaleString()}
            </div>
          </div>
          
          {latestLog.data?.intermediate_results && (
            <div>
              <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Results Preview
              </div>
              <div className={`text-xs p-2 rounded font-mono ${
                darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'
              }`}>
                {Object.keys(latestLog.data.intermediate_results).length > 0 ? (
                  <div>
                    {Object.entries(latestLog.data.intermediate_results).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <span className="font-semibold">{key}:</span> {
                          typeof value === 'object' && value !== null && 'response' in value 
                            ? `"${(value as any).response?.substring(0, 50)}..."` 
                            : JSON.stringify(value).substring(0, 50) + '...'
                        }
                      </div>
                    ))}
                  </div>
                ) : (
                  'No results available'
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {nodeLogs.length} total execution{nodeLogs.length !== 1 ? 's' : ''}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              Click node to view all logs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CustomGraphNodeProps {
  node: StudioGraphNode;
  isSelected: boolean;
  isActive: boolean;
  isHighlighted: boolean;
  hasBreakpoint: boolean;
  onClick: (nodeId: string) => void;
  onBreakpointToggle: (nodeId: string) => void;
  scale: number;
  logs: ExecutionLog[];
  onShowLogTooltip: (nodeId: string, position: { x: number; y: number }) => void;
  onHideLogTooltip: () => void;
}

const CustomGraphNode: React.FC<CustomGraphNodeProps> = ({ 
  node, 
  isSelected, 
  isActive, 
  isHighlighted,
  hasBreakpoint,
  onClick,
  onBreakpointToggle,
  scale,
  logs,
  onShowLogTooltip,
  onHideLogTooltip
}) => {
  const { darkMode } = useStudioStore();
  
  // Check if this node has execution logs
  const nodeLogs = logs.filter(log => log.nodeId === node.id);
  const hasLogs = nodeLogs.length > 0;
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (hasLogs) {
      const rect = e.currentTarget.getBoundingClientRect();
      onShowLogTooltip(node.id, { x: rect.right, y: rect.top });
    }
  };
  
  const handleMouseLeave = () => {
    if (hasLogs) {
      onHideLogTooltip();
    }
  };
  
  const getNodeColor = (nodeType: string, status?: string) => {
    const nodeTypeColors = {
      start: {
        bg: darkMode ? '#1e3a8a' : '#dbeafe',
        border: '#3b82f6',
        text: darkMode ? '#bfdbfe' : '#1e40af',
        indicator: '#3b82f6',
        icon: '🚀'
      },
      end: {
        bg: darkMode ? '#7f1d1d' : '#fef2f2',
        border: '#ef4444',
        text: darkMode ? '#fecaca' : '#991b1b',
        indicator: '#ef4444',
        icon: '🏁'
      },
      agent: {
        bg: darkMode ? '#581c87' : '#f3e8ff',
        border: '#8b5cf6',
        text: darkMode ? '#ddd6fe' : '#6b21a8',
        indicator: '#8b5cf6',
        icon: '🤖'
      },
      tool: {
        bg: darkMode ? '#14532d' : '#dcfce7',
        border: '#10b981',
        text: darkMode ? '#bbf7d0' : '#065f46',
        indicator: '#10b981',
        icon: '🔧'
      },
      human: {
        bg: darkMode ? '#92400e' : '#fef3c7',
        border: '#f59e0b',
        text: darkMode ? '#fde68a' : '#92400e',
        indicator: '#f59e0b',
        icon: '👤'
      },
      condition: {
        bg: darkMode ? '#7c2d12' : '#fed7aa',
        border: '#ea580c',
        text: darkMode ? '#fed7aa' : '#9a3412',
        indicator: '#ea580c',
        icon: '🔀'
      },
      retrieval: {
        bg: darkMode ? '#164e63' : '#cffafe',
        border: '#0891b2',
        text: darkMode ? '#a5f3fc' : '#164e63',
        indicator: '#0891b2',
        icon: '🔍'
      },
      processing: {
        bg: darkMode ? '#4c1d95' : '#ede9fe',
        border: '#7c3aed',
        text: darkMode ? '#c4b5fd' : '#4c1d95',
        indicator: '#7c3aed',
        icon: '⚙️'
      },
      generation: {
        bg: darkMode ? '#be185d' : '#fce7f3',
        border: '#ec4899',
        text: darkMode ? '#fbcfe8' : '#be185d',
        indicator: '#ec4899',
        icon: '✨'
      },
      validation: {
        bg: darkMode ? '#365314' : '#ecfccb',
        border: '#65a30d',
        text: darkMode ? '#d9f99d' : '#365314',
        indicator: '#65a30d',
        icon: '✅'
      },
      default: {
        bg: darkMode ? '#374151' : '#f9fafb',
        border: darkMode ? '#6b7280' : '#d1d5db',
        text: darkMode ? '#e5e7eb' : '#374151',
        indicator: darkMode ? '#9ca3af' : '#6b7280',
        icon: '📦'
      }
    };

    const baseColors = nodeTypeColors[nodeType as keyof typeof nodeTypeColors] || nodeTypeColors.default;
    
    if (status === 'running') {
      return { ...baseColors, bg: darkMode ? '#1e3a8a' : '#dbeafe', border: '#3b82f6', indicator: '#3b82f6' };
    } else if (status === 'completed') {
      return { ...baseColors, bg: darkMode ? '#14532d' : '#dcfce7', border: '#10b981', indicator: '#10b981' };
    } else if (status === 'error') {
      return { ...baseColors, bg: darkMode ? '#7f1d1d' : '#fef2f2', border: '#ef4444', indicator: '#ef4444' };
    } else if (status === 'paused') {
      return { ...baseColors, bg: darkMode ? '#92400e' : '#fef3c7', border: '#f59e0b', indicator: '#f59e0b' };
    }

    return baseColors;
  };

  const colors = getNodeColor(node.type, node.data.status);
  const nodeWidth = 160;
  const nodeHeight = 100;

  return (
    <g 
      transform={`translate(${node.position.x}, ${node.position.y})`} 
      className="cursor-pointer graph-node-group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <filter id={`shadow-${node.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={darkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"} floodOpacity="1" />
        </filter>
        <linearGradient id={`gradient-${node.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.bg} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.bg} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {hasBreakpoint && (
        <circle
          cx={-8} cy={8} r={6}
          fill="#ef4444"
          stroke={darkMode ? "#1f2937" : "#ffffff"}
          strokeWidth={2}
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onBreakpointToggle(node.id); }}
        />
      )}
      
      {/* Info icon for nodes with logs */}
      {hasLogs && (
        <circle
          cx={nodeWidth - 8} cy={8} r={8}
          fill={darkMode ? "#3b82f6" : "#2563eb"}
          stroke={darkMode ? "#1f2937" : "#ffffff"}
          strokeWidth={2}
          className="cursor-pointer animate-pulse"
        />
      )}
      
      {hasLogs && (
        <text
          x={nodeWidth - 8} y={8}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="10"
          fill="white"
          className="pointer-events-none font-bold"
        >
          ℹ️
        </text>
      )}
      
      {isActive && (
        <rect
          width={nodeWidth + 12} height={nodeHeight + 12}
          x={-6} y={-6} rx={20}
          fill={colors.indicator} opacity="0.2"
          className="animate-pulse"
        />
      )}
      
      {isHighlighted && (
        <rect
          width={nodeWidth + 16} height={nodeHeight + 16}
          x={-8} y={-8} rx={22}
          fill="none" stroke="#f59e0b"
          strokeWidth={3} strokeDasharray="12,6"
          className="animate-pulse"
          opacity="0.8"
        />
      )}
      
      <rect
        width={nodeWidth} height={nodeHeight} rx={16}
        fill={`url(#gradient-${node.id})`}
        stroke={colors.border}
        strokeWidth={isSelected ? 3 : isHighlighted ? 2.5 : 2}
        filter={`url(#shadow-${node.id})`}
        onClick={() => onClick(node.id)}
        className={isHighlighted ? 'animate-pulse' : ''}
      />
      
      <foreignObject x={16} y={16} width={nodeWidth - 32} height={nodeHeight - 32} style={{ pointerEvents: 'none' }}>
        <div className="h-full flex flex-col justify-between" style={{ pointerEvents: 'none' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{colors.icon}</span>
              <span className="font-semibold text-sm truncate" style={{ color: colors.text }}>{node.data.label}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div 
                className={`w-3 h-3 rounded-full ${node.data.status === 'running' ? 'animate-pulse' : ''}`}
                style={{ 
                  backgroundColor: colors.indicator,
                  boxShadow: node.data.status === 'running' ? `0 0 8px ${colors.indicator}` : 'none'
                }}
              />
              {hasLogs && (
                <div 
                  className={`text-xs px-1 py-0.5 rounded-full font-bold ${
                    darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}
                  title={`${nodeLogs.length} execution log${nodeLogs.length !== 1 ? 's' : ''}`}
                >
                  {nodeLogs.length}
                </div>
              )}
            </div>
          </div>
          
          <div 
            className="text-xs px-2 py-1 rounded-full self-start font-medium"
            style={{ backgroundColor: colors.indicator + '20', color: colors.text }}
          >
            {node.type}
          </div>
          
          {node.data.description && (
            <div className="text-xs mt-1 line-clamp-2 opacity-80 leading-relaxed" style={{ color: colors.text }}>
              {node.data.description}
            </div>
          )}
          
          <div className="text-xs mt-1 opacity-60 font-medium" style={{ color: colors.text }}>
            {hasLogs ? `Click to view ${nodeLogs.length} logs • Hover for details` : 'Click to view • Right-click for breakpoint'}
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

const CustomGraphEdge: React.FC<{
  edge: GraphEdge;
  nodes: StudioGraphNode[];
  isActive: boolean;
  isInExecutionPath: boolean;
}> = ({ edge, nodes, isActive, isInExecutionPath }) => {
  const { darkMode } = useStudioStore();
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  const nodeWidth = 160;
  const nodeHeight = 100;
  
  const startX = sourceNode.position.x + nodeWidth;
  const startY = sourceNode.position.y + nodeHeight / 2;
  const endX = targetNode.position.x;
  const endY = targetNode.position.y + nodeHeight / 2;

  const midX = (startX + endX) / 2;
  const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

  const getEdgeColor = () => {
    if (isActive) return "#3b82f6";
    if (isInExecutionPath) return "#10b981";
    return darkMode ? "#6b7280" : "#9ca3af";
  };

  const edgeColor = getEdgeColor();
  const edgeWidth = isActive ? 3 : isInExecutionPath ? 2.5 : 2;

  return (
    <g>
      <defs>
        <marker
          id={`arrowhead-${edge.id}`}
          markerWidth="10" markerHeight="7"
          refX="9" refY="3.5" orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={edgeColor} />
        </marker>
      </defs>
      
      <path
        d={pathData} fill="none"
        stroke={darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}
        strokeWidth={edgeWidth + 1}
        transform="translate(1, 2)"
      />
      
      <path
        d={pathData} fill="none"
        stroke={edgeColor} strokeWidth={edgeWidth}
        className={`transition-all duration-300 ${
          isActive ? "animate-pulse" : ""
        } ${isInExecutionPath ? "execution-path-animated" : ""}`}
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${edgeColor})` : 'none' }}
        markerEnd={`url(#arrowhead-${edge.id})`}
      />
      
      {isActive && (
        <path
          d={pathData} fill="none"
          stroke={edgeColor} strokeWidth={edgeWidth + 4}
          opacity="0.3" className="animate-pulse"
        />
      )}
    </g>
  );
};

// Dynamic Input Form Component
const DynamicInputForm: React.FC<{
  currentState: any;
  onStateChange: (newState: any) => void;
  onStartExecution: (state: any, startNode?: string) => void;
  darkMode: boolean;
}> = ({ currentState, onStateChange, onStartExecution, darkMode }) => {
  const [formData, setFormData] = useState<any>({
    messages: [{ role: 'user', content: '' }],
    router: {},
    steps: [],
    documents: [],
    current_node: '',
    session_id: '',
    user_query_original: '',
    queries_generated: [],
    execution_history: [],
    research_progress: {},
    intermediate_results: {},
    error_log: []
  });
  const [startFromNode, setStartFromNode] = useState('');
  const [viewMode, setViewMode] = useState<'form' | 'raw'>('form');
  const { graphState } = useStudioStore();

  useEffect(() => {
    // Initialize form data with current state
    setFormData((prev: any) => ({ ...prev, ...currentState }));
  }, [currentState]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayAdd = (field: string, item: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), item]
    }));
  };

  const handleArrayRemove = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const handleMessageChange = (index: number, field: 'role' | 'content', value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      messages: prev.messages.map((msg: any, i: number) => 
        i === index ? { ...msg, [field]: value } : msg
      )
    }));
  };

  const addMessage = () => {
    handleArrayAdd('messages', { role: 'user', content: '' });
  };

  const removeMessage = (index: number) => {
    handleArrayRemove('messages', index);
  };

  const handleSubmit = () => {
    const cleanedData = { ...formData };
    // Remove empty fields
    Object.keys(cleanedData).forEach(key => {
      if (Array.isArray(cleanedData[key]) && cleanedData[key].length === 0) {
        delete cleanedData[key];
      } else if (typeof cleanedData[key] === 'string' && cleanedData[key].trim() === '') {
        delete cleanedData[key];
      } else if (typeof cleanedData[key] === 'object' && Object.keys(cleanedData[key]).length === 0) {
        delete cleanedData[key];
      }
    });

    onStateChange(cleanedData);
    onStartExecution(cleanedData, startFromNode || undefined);
  };

  const renderFormField = (key: string, value: any) => {
    if (key === 'messages') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Messages
            </label>
            <button
              onClick={addMessage}
              className={`px-2 py-1 text-xs rounded ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              + Add Message
            </button>
          </div>
          {formData.messages.map((message: any, index: number) => (
            <div key={index} className={`p-3 border rounded ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <select
                  value={message.role}
                  onChange={(e) => handleMessageChange(index, 'role', e.target.value)}
                  className={`px-2 py-1 text-xs border rounded ${
                    darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                  <option value="system">System</option>
                </select>
                <button
                  onClick={() => removeMessage(index)}
                  className={`px-2 py-1 text-xs rounded ${
                    darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Remove
                </button>
              </div>
              <textarea
                value={message.content}
                onChange={(e) => handleMessageChange(index, 'content', e.target.value)}
                placeholder="Enter message content..."
                className={`w-full px-2 py-2 text-xs border rounded h-20 ${
                  darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
            <button
              onClick={() => handleArrayAdd(key, '')}
              className={`px-2 py-1 text-xs rounded ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              + Add Item
            </button>
          </div>
          {value.map((item: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={typeof item === 'string' ? item : JSON.stringify(item)}
                onChange={(e) => {
                  const newArray = [...value];
                  try {
                    newArray[index] = JSON.parse(e.target.value);
                  } catch {
                    newArray[index] = e.target.value;
                  }
                  handleFieldChange(key, newArray);
                }}
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                onClick={() => handleArrayRemove(key, index)}
                className={`px-2 py-1 text-xs rounded ${
                  darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-2">
          <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </label>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(key, parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            className={`w-full px-2 py-2 text-xs font-mono border rounded h-20 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className={`w-full px-2 py-1 text-xs border rounded ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
        />
      </div>
    );
  };

  return (
    <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Input
        </h3>
        <div className="flex items-center space-x-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'form' | 'raw')}
            className={`px-2 py-1 text-xs border rounded ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="form">Form View</option>
            <option value="raw">Raw JSON</option>
          </select>
        </div>
      </div>

      {/* Start from node selector */}
      <div className="mb-3">
        <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Start from node (optional):
        </label>
        <select
          value={startFromNode}
          onChange={(e) => setStartFromNode(e.target.value)}
          className={`w-full px-2 py-1 text-xs border rounded ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">Start from beginning</option>
          {graphState.nodes.map(node => (
            <option key={node.id} value={node.id}>
              {node.data.label} ({node.id})
            </option>
          ))}
        </select>
      </div>

      {viewMode === 'form' ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key}>
              {renderFormField(key, value)}
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <textarea
            value={JSON.stringify(formData, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData(parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            className={`w-full px-2 py-2 text-xs font-mono border rounded h-64 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder='{"messages": [{"role": "user", "content": "Hello"}]}'
          />
        </div>
      )}

      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => onStateChange(formData)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Update State
        </button>
        <button
          onClick={handleSubmit}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center shadow-sm hover:shadow-md ${
            darkMode ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105' : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Submit
        </button>
      </div>
    </div>
  );
};

const LiveLogsPanel: React.FC<{
  logs: ExecutionLog[];
  darkMode: boolean;
  onLogHover: (nodeId: string | null) => void;
  onLogSelect: (logId: string | null) => void;
  selectedLogId: string | null;
}> = ({ logs, darkMode, onLogHover, onLogSelect, selectedLogId }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const selectedLogRef = useRef<HTMLDivElement>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Scroll to selected log when it changes
  useEffect(() => {
    if (selectedLogId && selectedLogRef.current) {
      selectedLogRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [selectedLogId]);

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
        ref={isSelected ? selectedLogRef : undefined}
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
                  {isSelected && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      FOCUSED
                    </span>
                  )}
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
          
          {/* Intermediate Results Preview */}
          {log.data?.intermediate_results && !isExpanded && (
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
              {/* Performance Metrics */}
              {log.data.performance && (
                <div className={`p-3 rounded-lg performance-card ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-semibold mb-2 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className="mr-2">⚡</span>
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</div>
                      <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {log.data.performance.duration_ms}ms
                      </div>
                    </div>
                    <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Node Type</div>
                      <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {log.data.performance.node_type}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* State Updates */}
              {log.data.state_updates && (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-semibold mb-2 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className="mr-2">🔄</span>
                    State Updates
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(log.data.state_updates).map(([key, value]) => (
                      <div key={key} className={`p-2 rounded border-l-4 border-blue-500 state-update-indicator ${
                        darkMode ? 'bg-gray-700' : 'bg-white'
                      }`}>
                        <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {key}
                        </div>
                        <div className={`text-xs font-mono mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Output Data */}
              {log.data.output && (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-semibold mb-2 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className="mr-2">📤</span>
                    Output Data
                  </h4>
                  <pre className={`text-xs font-mono p-3 rounded overflow-x-auto log-data-json ${
                    darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'
                  }`}>
                    {JSON.stringify(log.data.output, null, 2)}
                  </pre>
                </div>
              )}

              {/* Current State */}
              {log.data.current_state && (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-semibold mb-2 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className="mr-2">🔍</span>
                    Current State
                  </h4>
                  <pre className={`text-xs font-mono p-3 rounded overflow-x-auto log-data-json ${
                    darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'
                  }`}>
                    {JSON.stringify(log.data.current_state, null, 2)}
                  </pre>
                </div>
              )}

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

// Modern State View Component
const StateView: React.FC<{
  currentState: any;
  executionContext: any;
  darkMode: boolean;
}> = ({ currentState, executionContext, darkMode }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const formatValue = (value: any, key?: string): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') {
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
    }
    if (Array.isArray(value)) {
      return `Array(${value.length})`;
    }
    if (typeof value === 'object') {
      return `Object(${Object.keys(value).length} keys)`;
    }
    return String(value);
  };

  const getValueTypeColor = (value: any) => {
    if (value === null || value === undefined) return darkMode ? 'text-gray-500' : 'text-gray-400';
    if (typeof value === 'boolean') return darkMode ? 'text-purple-400' : 'text-purple-600';
    if (typeof value === 'number') return darkMode ? 'text-blue-400' : 'text-blue-600';
    if (typeof value === 'string') return darkMode ? 'text-green-400' : 'text-green-600';
    if (Array.isArray(value)) return darkMode ? 'text-orange-400' : 'text-orange-600';
    if (typeof value === 'object') return darkMode ? 'text-cyan-400' : 'text-cyan-600';
    return darkMode ? 'text-gray-300' : 'text-gray-700';
  };

  const getValueIcon = (value: any) => {
    if (value === null || value === undefined) return '∅';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'number') return '#';
    if (typeof value === 'string') return '"';
    if (Array.isArray(value)) return '[]';
    if (typeof value === 'object') return '{}';
    return '?';
  };

  const filteredEntries = Object.entries(currentState || {}).filter(([key, value]) => {
    if (!searchTerm) return true;
    return key.toLowerCase().includes(searchTerm.toLowerCase()) ||
           String(value).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const executionStats = {
    totalSteps: executionContext.logs.length,
    errors: executionContext.logs.filter((log: any) => log.type === 'error').length,
    duration: executionContext.startTime ? 
      (executionContext.endTime || new Date()).getTime() - executionContext.startTime.getTime() : 0,
    status: executionContext.isExecuting ? 
      (executionContext.isPaused ? 'Paused' : 'Running') : 'Idle'
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Current State
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {Object.keys(currentState || {}).length} fields
            </span>
          </div>
        </div>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search state fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-3 py-2 text-xs border rounded-lg ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Execution Overview */}
        <div className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <button
            onClick={() => toggleSection('overview')}
            className={`w-full p-4 text-left hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedSections.has('overview') ? 'rotate-90' : ''
                  } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Execution Overview
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                executionStats.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                executionStats.status === 'Paused' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {executionStats.status}
              </span>
            </div>
          </button>
          
          {expandedSections.has('overview') && (
            <div className={`px-4 pb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total Steps
                  </div>
                  <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {executionStats.totalSteps}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Errors
                  </div>
                  <div className={`text-lg font-bold ${
                    executionStats.errors > 0 ? 'text-red-500' : (darkMode ? 'text-white' : 'text-gray-900')
                  }`}>
                    {executionStats.errors}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Duration
                  </div>
                  <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {executionStats.duration > 0 ? `${(executionStats.duration / 1000).toFixed(1)}s` : '0s'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Breakpoints
                  </div>
                  <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {executionContext.breakpoints.filter((bp: any) => bp.enabled).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* State Fields */}
        <div className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <button
            onClick={() => toggleSection('fields')}
            className={`w-full p-4 text-left hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expandedSections.has('fields') ? 'rotate-90' : ''
                  } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  State Fields
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                {filteredEntries.length}
              </span>
            </div>
          </button>
          
          {expandedSections.has('fields') && (
            <div className="space-y-1">
              {filteredEntries.length === 0 ? (
                <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-2xl mb-2">📭</div>
                  <p className="text-sm">
                    {Object.keys(currentState || {}).length === 0 ? 'No state data' : 'No fields match your search'}
                  </p>
                </div>
              ) : (
                filteredEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-3 border-l-4 transition-colors ${
                      darkMode ? 'border-l-gray-600 hover:bg-gray-700' : 'border-l-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className={`text-sm ${getValueTypeColor(value)}`}>
                          {getValueIcon(value)}
                        </span>
                        <span className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {key}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-mono ${
                        darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {typeof value}
                      </span>
                    </div>
                    <div className={`mt-1 text-xs font-mono ${getValueTypeColor(value)}`}>
                      {formatValue(value, key)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Raw JSON View */}
        <div>
          <button
            onClick={() => toggleSection('raw')}
            className={`w-full p-4 text-left hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedSections.has('raw') ? 'rotate-90' : ''
                } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Raw JSON
              </span>
            </div>
          </button>
          
          {expandedSections.has('raw') && (
            <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <pre className={`text-xs font-mono p-3 rounded-lg overflow-x-auto ${
                darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'
              }`}>
                {JSON.stringify(currentState || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GraphView: React.FC = () => {
  const { 
    graphState, 
    setGraphState, 
    darkMode, 
    config, 
    isConnected,
    executionContext,
    startExecution,
    pauseExecution,
    resumeExecution,
    stopExecution,
    stepExecution,
    addExecutionLog,
    clearExecutionLogs,
    setGraphExecutionState,
    addBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    focusOnNode,
    fitGraphToView,
    startGlobalExecution
  } = useStudioStore();
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [controlsPosition, setControlsPosition] = useState<'right' | 'bottom'>('bottom');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'logs' | 'state'>('input');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [executionContextInfo, setExecutionContextInfo] = useState<string | null>(null);
  const [isAutoFocusing, setIsAutoFocusing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);
  
  const showLogTooltip = (nodeId: string, position: { x: number; y: number }) => {
    setTooltip({ nodeId, position });
  };
  
  const hideLogTooltip = () => {
    setTooltip(null);
  };

  // Auto-focus on logs during execution
  useEffect(() => {
    if (executionContext.isExecuting && !executionContext.isPaused) {
      setActiveTab('logs');
    }
  }, [executionContext.isExecuting, executionContext.isPaused]);

  // Auto-focus on currently executing node
  useEffect(() => {
    if (graphState.currentNode && executionContext.isExecuting && !executionContext.isPaused) {
      setIsAutoFocusing(true);
      focusOnNodeInternal(graphState.currentNode);
      setTimeout(() => setIsAutoFocusing(false), 1000);
    }
  }, [graphState.currentNode, executionContext.isExecuting, executionContext.isPaused]);

  // Show execution context info when it changes
  useEffect(() => {
    const { selectedThread, selectedAssistant } = useStudioStore.getState();
    if (selectedThread && selectedAssistant) {
      const contextInfo = `${selectedThread.name} • ${selectedAssistant.name}`;
      setExecutionContextInfo(contextInfo);
      setTimeout(() => setExecutionContextInfo(null), 3000);
    }
  }, [executionContext.threadId, executionContext.assistantId]);

  // Internal function to focus on a specific node
  const focusOnNodeInternal = (nodeId: string) => {
    const node = graphState.nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // Calculate the center position for the node
    const targetX = canvasWidth / 2 - node.position.x * scale - 80; // 80 is half node width
    const targetY = canvasHeight / 2 - node.position.y * scale - 50; // 50 is half node height

    // Smooth animation to the target position
    const startPan = { ...pan };
    const targetPan = { x: targetX, y: targetY };
    const duration = 800; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);

      const currentPan = {
        x: startPan.x + (targetPan.x - startPan.x) * easedProgress,
        y: startPan.y + (targetPan.y - startPan.y) * easedProgress,
      };

      setPan(currentPan);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // Internal function to fit graph to view
  const fitGraphToViewInternal = () => {
    if (graphState.nodes.length === 0 || !canvasRef.current) return;

    const bounds = graphState.nodes.reduce((acc, node) => {
      return {
        minX: Math.min(acc.minX, node.position.x),
        maxX: Math.max(acc.maxX, node.position.x + 160),
        minY: Math.min(acc.minY, node.position.y),
        maxY: Math.max(acc.maxY, node.position.y + 100),
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    const padding = 50;
    const graphWidth = bounds.maxX - bounds.minX + padding * 2;
    const graphHeight = bounds.maxY - bounds.minY + padding * 2;
    
    const viewportWidth = canvasRef.current.clientWidth;
    const viewportHeight = canvasRef.current.clientHeight;
    
    const scaleX = viewportWidth / graphWidth;
    const scaleY = viewportHeight / graphHeight;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    const targetPan = {
      x: -(bounds.minX - padding) * newScale + (viewportWidth - graphWidth * newScale) / 2,
      y: -(bounds.minY - padding) * newScale + (viewportHeight - graphHeight * newScale) / 2,
    };

    // Smooth animation to fit view
    const startScale = scale;
    const startPan = { ...pan };
    const duration = 1000; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);

      const currentScale = startScale + (newScale - startScale) * easedProgress;
      const currentPan = {
        x: startPan.x + (targetPan.x - startPan.x) * easedProgress,
        y: startPan.y + (targetPan.y - startPan.y) * easedProgress,
      };

      setScale(currentScale);
      setPan(currentPan);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // Update store functions to use internal implementations
  useEffect(() => {
    // Override store functions with our internal implementations
    const store = useStudioStore.getState();
    store.focusOnNode = focusOnNodeInternal;
    store.fitGraphToView = fitGraphToViewInternal;
  }, [scale, pan, graphState.nodes]);

  // Sample graph data for demonstration
  useEffect(() => {
    const isDemoMode = config.apiUrl.includes('localhost:3000') || !isConnected;
    
    if (graphState.nodes.length === 0 && isDemoMode) {
      const sampleNodes: StudioGraphNode[] = [
        {
          id: '__start__',
          type: 'start',
          data: { label: '__start__', description: 'Entry point of the graph', status: 'idle' },
          position: { x: 100, y: 200 },
        },
        {
          id: 'initialize_state',
          type: 'processing',
          data: { label: 'initialize_state', description: 'Initialize conversation state and context', status: 'idle' },
          position: { x: 340, y: 200 },
        },
        {
          id: 'analyze_and_route',
          type: 'condition',
          data: { label: 'analyze_and_route', description: 'Analyze user input and determine routing', status: 'idle' },
          position: { x: 580, y: 200 },
        },
        {
          id: 'ask_for_more_info',
          type: 'human',
          data: { label: 'ask_for_more...', description: 'Request additional information from user', status: 'idle' },
          position: { x: 820, y: 60 },
        },
        {
          id: 'respond_to_greeting',
          type: 'generation',
          data: { label: 'respond_to_g...', description: 'Generate appropriate greeting response', status: 'idle' },
          position: { x: 820, y: 200 },
        },
        {
          id: 'conduct_research',
          type: 'retrieval',
          data: { label: 'conduct_res...', description: 'Search and retrieve relevant information', status: 'idle' },
          position: { x: 820, y: 340 },
        },
        {
          id: 'create_research_plan',
          type: 'agent',
          data: { label: 'create_resear...', description: 'Create comprehensive research strategy', status: 'idle' },
          position: { x: 1060, y: 60 },
        },
        {
          id: 'check_progress',
          type: 'validation',
          data: { label: 'check_progr...', description: 'Validate research progress and quality', status: 'idle' },
          position: { x: 1300, y: 200 },
        },
        {
          id: 'respond',
          type: 'generation',
          data: { label: 'respond', description: 'Generate final response to user', status: 'idle' },
          position: { x: 1540, y: 200 },
        },
        {
          id: '__end__',
          type: 'end',
          data: { label: '__end__', description: 'Graph execution complete', status: 'idle' },
          position: { x: 1780, y: 200 },
        },
      ];

      const sampleEdges: GraphEdge[] = [
        { id: 'e1', source: '__start__', target: 'initialize_state' },
        { id: 'e2', source: 'initialize_state', target: 'analyze_and_route' },
        { id: 'e3', source: 'analyze_and_route', target: 'ask_for_more_info' },
        { id: 'e4', source: 'analyze_and_route', target: 'respond_to_greeting' },
        { id: 'e5', source: 'analyze_and_route', target: 'conduct_research' },
        { id: 'e6', source: 'ask_for_more_info', target: 'create_research_plan' },
        { id: 'e7', source: 'create_research_plan', target: 'check_progress' },
        { id: 'e8', source: 'conduct_research', target: 'check_progress' },
        { id: 'e9', source: 'check_progress', target: 'respond' },
        { id: 'e10', source: 'respond_to_greeting', target: 'respond' },
        { id: 'e11', source: 'respond', target: '__end__' },
      ];

      setGraphState({
        nodes: sampleNodes,
        edges: sampleEdges,
        currentNode: undefined,
        executionPath: [],
      });
    }
  }, [graphState.nodes.length, setGraphState, config.apiUrl, isConnected]);

  // Real execution engine with live logging
  useEffect(() => {
    if (!executionContext.isExecuting || executionContext.isPaused) return;

    const executeNextNode = async () => {
      const currentNodeId = graphState.currentNode;
      if (!currentNodeId) return;

      const currentNode = graphState.nodes.find(n => n.id === currentNodeId);
      if (!currentNode) return;

      // Check for breakpoint
      const breakpoint = executionContext.breakpoints.find(bp => bp.nodeId === currentNodeId && bp.enabled);
      if (breakpoint) {
        pauseExecution();
        addExecutionLog({
          nodeId: currentNodeId,
          nodeName: currentNode.data.label,
          type: 'info',
          message: `Execution paused at breakpoint: ${currentNode.data.label}`,
        });
        return;
      }

      // Simulate node execution
      const startTime = Date.now();
      
      // Log input with current state
      addExecutionLog({
        nodeId: currentNodeId,
        nodeName: currentNode.data.label,
        type: 'input',
        message: `Starting execution of ${currentNode.data.label}`,
        data: {
          node_type: currentNode.type,
          current_state: executionContext.currentState,
          timestamp: new Date().toISOString()
        },
      });

      // Update node status to running
      const updatedNodes = graphState.nodes.map(node =>
        node.id === currentNodeId
          ? { ...node, data: { ...node.data, status: 'running' as const } }
          : node
      );
      setGraphState({ ...graphState, nodes: updatedNodes });

      // Simulate processing time based on node type
      const processingTime = currentNode.type === 'agent' ? 2000 + Math.random() * 3000 :
                           currentNode.type === 'tool' ? 1000 + Math.random() * 2000 :
                           currentNode.type === 'retrieval' ? 1500 + Math.random() * 2500 :
                           500 + Math.random() * 1500;
      
      await new Promise(resolve => setTimeout(resolve, processingTime));

      const duration = Date.now() - startTime;

      // Simulate realistic node output based on type and current state
      let output: any = {};
      let stateUpdates: any = {};
      let nextNodes: string[] = [];

      switch (currentNode.type) {
        case 'start':
          output = { 
            initialized: true, 
            timestamp: new Date().toISOString(),
            session_id: `session_${Date.now()}`
          };
          stateUpdates = {
            session_id: output.session_id,
            current_node: currentNodeId,
            execution_history: [{ node: currentNodeId, timestamp: output.timestamp }]
          };
          break;
          
        case 'processing':
        case 'initialize_state':
          const userMessage = executionContext.currentState.messages?.[0]?.content || 'Hello';
          output = { 
            processed: true,
            user_query_original: userMessage,
            context: {
              user_intent: 'research_query',
              complexity: 'medium',
              domain: 'general'
            }
          };
          stateUpdates = {
            user_query_original: output.user_query_original,
            context: output.context,
            current_node: currentNodeId
          };
          break;
          
        case 'condition':
        case 'analyze_and_route':
          const routingDecision = Math.random();
          let route = 'respond_to_greeting';
          if (routingDecision > 0.7) route = 'conduct_research';
          else if (routingDecision > 0.4) route = 'ask_for_more_info';
          
          output = {
            routing_decision: route,
            confidence: routingDecision,
            reasoning: `Based on user query analysis, routing to ${route}`,
            analysis: {
              query_type: route === 'conduct_research' ? 'research' : 'greeting',
              requires_clarification: route === 'ask_for_more_info'
            }
          };
          stateUpdates = {
            router: output,
            current_node: currentNodeId
          };
          break;
          
        case 'agent':
        case 'generation':
          const userQuery = executionContext.currentState.user_query_original || 
                           executionContext.currentState.messages?.[0]?.content || 
                           'Hello';
          
          let generatedResponse = '';
          
          if (currentNode.id === 'respond_to_greeting') {
            if (userQuery.toLowerCase().includes('hello') || userQuery.toLowerCase().includes('hi')) {
              generatedResponse = `Hello! I'm here to help you with research and questions. What would you like to know about?`;
            } else {
              generatedResponse = `Hi there! I see you're asking about "${userQuery}". I'm ready to help you with research and provide detailed information. How can I assist you today?`;
            }
          } else if (currentNode.id === 'respond') {
            // Generate contextual response based on what was processed
            const hasDocuments = executionContext.currentState.documents?.length > 0;
            const hasResearch = executionContext.currentState.research_progress?.documents_found > 0;
            
            if (hasDocuments && hasResearch) {
              const docCount = executionContext.currentState.documents.length;
              generatedResponse = `Based on my research regarding "${userQuery}", I found ${docCount} relevant sources. Here's what I discovered:\n\n` +
                                `• The topic has been thoroughly analyzed across multiple dimensions\n` +
                                `• Key insights have been extracted from authoritative sources\n` +
                                `• The information provides comprehensive coverage of your query\n\n` +
                                `The research indicates strong evidence supporting the main concepts you're interested in. ` +
                                `Would you like me to dive deeper into any specific aspect of this topic?`;
            } else if (userQuery.toLowerCase().includes('research')) {
              generatedResponse = `I've analyzed your research request about "${userQuery}". While I've processed your query through our research pipeline, ` +
                                `I'd be happy to help you find specific information. Could you provide more details about what particular aspects you'd like me to focus on?`;
            } else {
              generatedResponse = `Thank you for your question about "${userQuery}". I've processed your request and I'm ready to provide you with helpful information. ` +
                                `Based on the analysis, this appears to be an interesting topic that I can certainly help you explore further. ` +
                                `What specific aspects would you like me to focus on?`;
            }
          } else if (currentNode.id === 'create_research_plan') {
            generatedResponse = `I've created a comprehensive research plan for "${userQuery}". The plan includes:\n\n` +
                              `• Multiple search strategies to ensure comprehensive coverage\n` +
                              `• Identification of key sources and databases to query\n` +
                              `• A systematic approach to validate and cross-reference findings\n\n` +
                              `This structured approach will help ensure we gather the most relevant and reliable information for your inquiry.`;
          } else {
            // Generic agent response with context
            generatedResponse = `I've processed your request about "${userQuery}" and generated a response based on the available context and analysis. ` +
                              `The system has completed its evaluation and I'm ready to provide you with the information you're looking for.`;
          }
          
          output = {
            response: generatedResponse,
            reasoning: `Generated contextual response for ${currentNode.data.label} based on user query: "${userQuery}"`,
            metadata: {
              model: 'gpt-4',
              tokens_used: Math.floor(Math.random() * 500) + 100,
              confidence: Math.random() * 0.3 + 0.7,
              user_query: userQuery,
              node_type: currentNode.type
            }
          };
          stateUpdates = {
            intermediate_results: {
              ...executionContext.currentState.intermediate_results,
              [currentNodeId]: output
            },
            current_node: currentNodeId,
            final_response: generatedResponse // Store as final response for easy extraction
          };
          break;
          
        case 'tool':
        case 'retrieval':
        case 'conduct_research':
          const documents = [
            { title: 'Research Document 1', content: 'Relevant information found...', score: 0.95 },
            { title: 'Research Document 2', content: 'Additional context...', score: 0.87 },
            { title: 'Research Document 3', content: 'Supporting evidence...', score: 0.82 }
          ];
          
          output = {
            documents_retrieved: documents,
            search_queries: ['primary query', 'secondary query', 'related terms'],
            total_results: documents.length,
            search_metadata: {
              search_time: duration,
              sources: ['academic', 'web', 'knowledge_base']
            }
          };
          stateUpdates = {
            documents: documents,
            queries_generated: output.search_queries,
            research_progress: {
              documents_found: documents.length,
              search_completed: true,
              timestamp: new Date().toISOString()
            },
            current_node: currentNodeId
          };
          break;
          
        case 'validation':
        case 'check_progress':
          const progressCheck = {
            documents_sufficient: true,
            quality_score: Math.random() * 0.3 + 0.7,
            completeness: Math.random() * 0.2 + 0.8,
            next_action: 'proceed_to_response'
          };
          
          output = {
            validation_result: progressCheck,
            recommendations: ['Proceed with current research', 'Quality is sufficient'],
            metrics: {
              coverage: progressCheck.completeness,
              relevance: progressCheck.quality_score
            }
          };
          stateUpdates = {
            research_progress: {
              ...executionContext.currentState.research_progress,
              validation_complete: true,
              quality_metrics: output.metrics
            },
            current_node: currentNodeId
          };
          break;
          
        default:
          output = { 
            completed: true, 
            result: `${currentNode.data.label} execution completed`,
            node_type: currentNode.type
          };
          stateUpdates = {
            current_node: currentNodeId,
            execution_history: [
              ...(executionContext.currentState.execution_history || []),
              { node: currentNodeId, timestamp: new Date().toISOString(), output }
            ]
          };
      }

      // Log detailed output
      addExecutionLog({
        nodeId: currentNodeId,
        nodeName: currentNode.data.label,
        type: 'output',
        message: `Completed execution of ${currentNode.data.label}`,
        data: {
          output,
          state_updates: stateUpdates,
          performance: {
            duration_ms: duration,
            node_type: currentNode.type,
            timestamp: new Date().toISOString()
          }
        },
        duration,
      });

      // Update execution state with new data
      const newState = { 
        ...executionContext.currentState, 
        ...stateUpdates,
        steps: [
          ...(executionContext.currentState.steps || []),
          {
            node: currentNodeId,
            input: executionContext.currentState,
            output,
            duration,
            timestamp: new Date().toISOString()
          }
        ]
      };
      setGraphExecutionState(newState);

      // Mark node as completed
      const completedNodes = graphState.nodes.map(node =>
        node.id === currentNodeId
          ? { ...node, data: { ...node.data, status: 'completed' as const } }
          : node
      );

      // Find next nodes
      const outgoingEdges = graphState.edges.filter(edge => edge.source === currentNodeId);
      nextNodes = outgoingEdges.map(edge => edge.target);

      if (nextNodes.length > 0) {
        // For demo, just pick the first next node (in real LangGraph, this would be based on routing logic)
        const nextNodeId = nextNodes[0];
        
        // Log transition
        addExecutionLog({
          nodeId: currentNodeId,
          nodeName: 'System',
          type: 'info',
          message: `Transitioning from ${currentNode.data.label} to ${graphState.nodes.find(n => n.id === nextNodeId)?.data.label}`,
          data: {
            from: currentNodeId,
            to: nextNodeId,
            available_routes: nextNodes
          }
        });
        
        setGraphState({
          ...graphState,
          nodes: completedNodes,
          currentNode: nextNodeId,
          executionPath: [...graphState.executionPath, nextNodeId],
        });
      } else {
        // Execution completed
        setGraphState({
          ...graphState,
          nodes: completedNodes,
          currentNode: undefined,
        });
        stopExecution();
        addExecutionLog({
          nodeId: currentNodeId,
          nodeName: 'System',
          type: 'info',
          message: 'Graph execution completed successfully',
          data: {
            final_state: newState,
            total_duration: executionContext.startTime ? Date.now() - executionContext.startTime.getTime() : 0,
            nodes_executed: graphState.executionPath.length + 1
          }
        });
      }
    };

    const timeoutId = setTimeout(executeNextNode, 500);
    return () => clearTimeout(timeoutId);
  }, [executionContext.isExecuting, executionContext.isPaused, graphState.currentNode]);

  // Wheel event handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.02 : 0.02;
      setScale(prev => Math.max(0.1, Math.min(3, prev + delta)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
    
    // Find logs for this node
    const nodeLogs = executionContext.logs.filter(log => log.nodeId === nodeId);
    if (nodeLogs.length > 0) {
      // Focus on the most recent log for this node
      const mostRecentLog = nodeLogs[nodeLogs.length - 1];
      setSelectedLog(mostRecentLog.id);
      
      // Auto-expand the logs panel if it's collapsed
      if (controlsCollapsed) {
        setControlsCollapsed(false);
      }
      
      // Switch to logs tab if we're in a different tab
      setActiveTab('logs');
      
      // Show a brief notification
      const nodeName = graphState.nodes.find(n => n.id === nodeId)?.data.label || nodeId;
      setExecutionContextInfo(`📋 Showing ${nodeLogs.length} logs for ${nodeName}`);
      setTimeout(() => setExecutionContextInfo(null), 3000);
      
      // Add a visual indicator that we're showing logs for this node
      console.log(`Showing execution logs for node: ${nodeId}`, {
        totalLogs: nodeLogs.length,
        mostRecentLog: mostRecentLog,
        nodeState: executionContext.currentState
      });
    } else {
      // No logs for this node yet
      const nodeName = graphState.nodes.find(n => n.id === nodeId)?.data.label || nodeId;
      setExecutionContextInfo(`ℹ️ No execution logs found for ${nodeName}`);
      setTimeout(() => setExecutionContextInfo(null), 2000);
      console.log(`No execution logs found for node: ${nodeId}`);
      setSelectedLog(null);
    }
  };

  const handleBreakpointToggle = (nodeId: string) => {
    const hasBreakpoint = executionContext.breakpoints.some(bp => bp.nodeId === nodeId);
    if (hasBreakpoint) {
      removeBreakpoint(nodeId);
    } else {
      addBreakpoint(nodeId);
    }
  };

  const handleStartExecution = (initialState: any = {}, startFromNode?: string) => {
    // Set initial state with default values
    const defaultState = {
      message: "Graph execution started from graph view",
      context: { source: 'graph' },
      timestamp: new Date().toISOString(),
      ...initialState
    };

    // Create a user message in chat to show that execution was started from graph
    const { selectedThread, threads, addThread, setSelectedThread, addMessageToThread } = useStudioStore.getState();
    
    let currentThread = selectedThread;
    
    // Create a thread if none exists
    if (!currentThread) {
      const newThread = {
        id: `thread-${Date.now()}`,
        name: 'Graph Execution',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        assistantId: 'graph-execution',
      };
      addThread(newThread);
      setSelectedThread(newThread);
      currentThread = newThread;
    }
    
    // Add a user message to show graph execution was initiated
    const userMessage: Message = {
      id: `msg-${Date.now()}-graph-user`,
      role: 'user',
      content: '🔄 **Graph Execution Initiated**\n\nStarted graph execution from the graph view. Monitoring the execution flow...',
      timestamp: new Date(),
    };
    
    addMessageToThread(currentThread.id, userMessage);

    // Use the global execution system
    startGlobalExecution('graph', defaultState);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const fitToScreen = () => {
    fitGraphToViewInternal();
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Top Toolbar */}
      <div className={`flex-shrink-0 px-4 py-2 border-b toolbar ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Graph Execution
            </h2>
            <div className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className={`px-2 py-1 rounded status-indicator ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                Current: {graphState.currentNode || 'None'}
              </span>
              <span className={`px-2 py-1 rounded status-indicator ${
                executionContext.isExecuting 
                  ? executionContext.isPaused
                    ? 'bg-orange-100 text-orange-700 paused'
                    : 'bg-blue-100 text-blue-700 active' 
                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                {executionContext.isExecuting 
                  ? executionContext.isPaused ? 'Paused' : 'Running'
                  : 'Idle'
                }
              </span>
              <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                Logs: {executionContext.logs.length}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                Breakpoints: {executionContext.breakpoints.filter(bp => bp.enabled).length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Execution Controls */}
            <div className={`flex items-center space-x-1 rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {!executionContext.isExecuting ? (
                <button
                  onClick={() => handleStartExecution()}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    darkMode ? 'text-green-400 hover:bg-gray-600' : 'text-green-600 hover:bg-white'
                  }`}
                  title="Start Execution"
                >
                  ▶️ Start
                </button>
              ) : (
                <button
                  onClick={stopExecution}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-white'
                  }`}
                  title="Stop Execution"
                >
                  ⏹️ Stop
                </button>
              )}
            </div>
            
            {/* View Controls */}
            <div className={`flex items-center space-x-1 rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={resetView}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-white'
                }`}
                title="Reset View"
              >
                Reset
              </button>
              <button
                onClick={fitToScreen}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-white'
                }`}
                title="Fit to Screen"
              >
                Fit
              </button>
              {graphState.currentNode && (
                <button
                  onClick={() => focusOnNodeInternal(graphState.currentNode!)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    darkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-white'
                  }`}
                  title="Focus on Current Node"
                >
                  Focus
                </button>
              )}
              <span className={`px-2 py-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Math.round(scale * 100)}%
              </span>
            </div>
            
            {/* Layout Toggle */}
            <div className={`flex items-center space-x-1 rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => setControlsPosition('right')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  controlsPosition === 'right' 
                    ? darkMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                    : darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-white'
                }`}
                title="Right Sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18m0 0l-3-3m3 3l3-3M21 3H9" />
                </svg>
              </button>
              <button
                onClick={() => setControlsPosition('bottom')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  controlsPosition === 'bottom' 
                    ? darkMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                    : darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-white'
                }`}
                title="Bottom Panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15v6h18v-6M3 9l3 3 3-3m6 0l3 3 3-3" />
                </svg>
              </button>
            </div>
            
            {/* Controls Toggle */}
            <button
              onClick={() => setControlsCollapsed(!controlsCollapsed)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={controlsCollapsed ? 'Show Controls' : 'Hide Controls'}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${
                  controlsPosition === 'right' 
                    ? (controlsCollapsed ? 'rotate-180' : '') 
                    : (controlsCollapsed ? 'rotate-90' : '-rotate-90')
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex ${controlsPosition === 'bottom' ? 'flex-col' : 'flex-row'} min-h-0 overflow-hidden`}
        style={{ height: 'calc(100vh - 60px)' }} // Account for toolbar height
      >
        {/* Graph Canvas */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          <div 
            className={`h-full relative overflow-hidden cursor-grab active:cursor-grabbing graph-canvas ${
              darkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={canvasRef}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <svg
              className="w-full h-full graph-svg"
              viewBox={`${-pan.x / scale} ${-pan.y / scale} ${(canvasRef.current?.clientWidth || 800) / scale} ${(canvasRef.current?.clientHeight || 600) / scale}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <rect 
                width="100%" 
                height="100%" 
                fill={darkMode ? "#1f2937" : "#f9fafb"} 
              />

              {/* Edges */}
              {graphState.edges.map((edge) => (
                <CustomGraphEdge
                  key={edge.id}
                  edge={edge}
                  nodes={graphState.nodes}
                  isActive={edge.source === graphState.currentNode || edge.target === graphState.currentNode}
                  isInExecutionPath={graphState.executionPath.includes(edge.source) && graphState.executionPath.includes(edge.target)}
                />
              ))}

              {/* Nodes */}
              {graphState.nodes.map((node) => (
                <CustomGraphNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNode === node.id}
                  isActive={node.id === graphState.currentNode}
                  isHighlighted={hoveredNode === node.id}
                  hasBreakpoint={executionContext.breakpoints.some(bp => bp.nodeId === node.id && bp.enabled)}
                  onClick={handleNodeClick}
                  onBreakpointToggle={handleBreakpointToggle}
                  scale={scale}
                  logs={executionContext.logs}
                  onShowLogTooltip={showLogTooltip}
                  onHideLogTooltip={hideLogTooltip}
                />
              ))}
            </svg>

            {/* Navigation Help */}
            <div className={`absolute bottom-4 left-4 rounded-lg shadow-lg border p-3 backdrop-blur-sm ${
              darkMode ? 'bg-gray-800/90 border-gray-600' : 'bg-white/90 border-gray-200'
            }`}>
              <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center">
                  <span className={`w-4 h-4 rounded mr-2 flex items-center justify-center text-xs ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>🖱️</span>
                  Drag to pan
                </div>
                <div className="flex items-center">
                  <span className={`w-4 h-4 rounded mr-2 flex items-center justify-center text-xs ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>⚡</span>
                  Scroll to zoom
                </div>
                <div className="flex items-center">
                  <span className={`w-4 h-4 rounded mr-2 flex items-center justify-center text-xs ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>🔴</span>
                  Red dot = breakpoint
                </div>
              </div>
            </div>

            {/* Execution context info */}
            {executionContextInfo && (
              <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 rounded-lg shadow-lg border p-3 backdrop-blur-sm context-switch-notification ${
                darkMode ? 'bg-green-900/90 border-green-600' : 'bg-green-50/90 border-green-200'
              }`}>
                <div className={`flex items-center space-x-2 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                  <span className="text-lg">🔄</span>
                  <span className="text-sm font-medium">{executionContextInfo}</span>
                </div>
              </div>
            )}

            {/* Graph Stats */}
            <div className={`absolute top-4 right-4 rounded-lg shadow-lg border p-3 backdrop-blur-sm ${
              darkMode ? 'bg-gray-800/90 border-gray-600' : 'bg-white/90 border-gray-200'
            }`}>
              <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex items-center justify-between space-x-3">
                  <span>Nodes:</span>
                  <span className="font-medium">{graphState.nodes.length}</span>
                </div>
                <div className="flex items-center justify-between space-x-3">
                  <span>Edges:</span>
                  <span className="font-medium">{graphState.edges.length}</span>
                </div>
                <div className="flex items-center justify-between space-x-3">
                  <span>Executed:</span>
                  <span className="font-medium">{graphState.executionPath.length}</span>
                </div>
                {executionContext.threadId && executionContext.assistantId && (
                  <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="text-xs font-medium mb-1">Context:</div>
                    <div className="text-xs opacity-75">
                      Thread: {executionContext.threadId.split('-')[0]}...
                    </div>
                    <div className="text-xs opacity-75">
                      Assistant: {executionContext.assistantId.split('-')[0]}...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        {!controlsCollapsed && (
          <div 
            className={`
              flex-shrink-0 transition-all duration-300 ease-in-out
              ${controlsPosition === 'right' ? 'w-96 border-l' : 'border-t'} 
              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}
            style={{
              height: controlsPosition === 'bottom' ? '40vh' : '100%',
              minHeight: controlsPosition === 'bottom' ? '300px' : '0px',
              maxHeight: controlsPosition === 'bottom' ? '50vh' : 'none',
            }}
          >
            <div className="h-full flex flex-col overflow-hidden">
              {/* Tab Navigation */}
              <div className={`flex border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                {[
                  { id: 'input', label: 'Input', icon: '📝' },
                  { id: 'logs', label: 'Logs', icon: '📋', badge: executionContext.logs.length },
                  { id: 'state', label: 'State', icon: '🔍', badge: Object.keys(executionContext.currentState || {}).length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'input' | 'logs' | 'state')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? darkMode 
                          ? 'bg-gray-700 text-white border-b-2 border-blue-500' 
                          : 'bg-gray-50 text-gray-900 border-b-2 border-blue-500'
                        : darkMode
                          ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activeTab === tab.id
                            ? 'bg-blue-500 text-white'
                            : darkMode
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-gray-200 text-gray-700'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                      {tab.id === 'logs' && executionContext.isExecuting && !executionContext.isPaused && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'input' && (
                  <div className="h-full flex flex-col">
                    <DynamicInputForm
                      currentState={executionContext.currentState}
                      onStateChange={setGraphExecutionState}
                      onStartExecution={handleStartExecution}
                      darkMode={darkMode}
                    />
                    
                    {/* Execution Controls */}
                    <div className={`p-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Execution Controls
                      </h3>
                      
                      <div className={`${controlsPosition === 'bottom' ? 'flex space-x-2' : 'space-y-2'}`}>
                        {!executionContext.isExecuting ? (
                          <button 
                            onClick={() => handleStartExecution()}
                            className={`${controlsPosition === 'bottom' ? 'flex-1' : 'w-full'} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
                              darkMode ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105' : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                            }`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 5a9 9 0 1118 0 9 9 0 01-18 0z" />
                            </svg>
                            Start Execution
                          </button>
                        ) : (
                          <>
                            {executionContext.isPaused ? (
                              <button 
                                onClick={resumeExecution}
                                className={`${controlsPosition === 'bottom' ? 'flex-1' : 'w-full'} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
                                  darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105' : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                                }`}
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 5a9 9 0 1118 0 9 9 0 01-18 0z" />
                                </svg>
                                Resume
                              </button>
                            ) : (
                              <button 
                                onClick={pauseExecution}
                                className={`${controlsPosition === 'bottom' ? 'flex-1' : 'w-full'} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
                                  darkMode ? 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105' : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105'
                                }`}
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pause
                              </button>
                            )}
                            
                            <button 
                              onClick={stepExecution}
                              className={`${controlsPosition === 'bottom' ? 'flex-1' : 'w-full'} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
                                darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105' : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'
                              }`}
                              disabled={!executionContext.isPaused}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Step
                            </button>
                            
                            <button 
                              onClick={stopExecution}
                              className={`${controlsPosition === 'bottom' ? 'flex-1' : 'w-full'} px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
                                darkMode ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105' : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                              }`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                              </svg>
                              Stop
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'logs' && (
                  <LiveLogsPanel
                    logs={executionContext.logs}
                    darkMode={darkMode}
                    onLogHover={setHoveredNode}
                    onLogSelect={setSelectedLog}
                    selectedLogId={selectedLog}
                  />
                )}

                {activeTab === 'state' && (
                  <StateView
                    currentState={executionContext.currentState}
                    executionContext={executionContext}
                    darkMode={darkMode}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Node Log Tooltip */}
      {tooltip && (
        <NodeLogTooltip
          nodeId={tooltip.nodeId}
          logs={executionContext.logs}
          darkMode={darkMode}
          position={tooltip.position}
          onClose={hideLogTooltip}
        />
      )}
    </div>
  );
}; 