#!/bin/bash

# GoLangGraph Studio Interface Startup Script
# This script starts the React development server for the GoLangGraph Studio interface

echo "🚀 Starting GoLangGraph Studio Interface..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Set default environment variables if not already set
export REACT_APP_GOLANGGRAPH_API_URL=${REACT_APP_GOLANGGRAPH_API_URL:-"http://localhost:8080"}
export REACT_APP_AGENT_ID=${REACT_APP_AGENT_ID:-""}
export REACT_APP_API_KEY=${REACT_APP_API_KEY:-""}

echo "🔧 Configuration:"
echo "   API URL: $REACT_APP_GOLANGGRAPH_API_URL"
echo "   Agent ID: ${REACT_APP_AGENT_ID:-"(not set)"}"
echo "   API Key: ${REACT_APP_API_KEY:+***set***}${REACT_APP_API_KEY:-"(not set)"}"
echo ""

echo "📋 Prerequisites:"
echo "   ✓ Node.js 16+ installed"
echo "   • GoLangGraph server running at $REACT_APP_GOLANGGRAPH_API_URL"
echo ""

echo "🌐 The interface will open at: http://localhost:3000"
echo "🛑 To stop the server, press Ctrl+C"
echo ""

# Start the development server
npm start 