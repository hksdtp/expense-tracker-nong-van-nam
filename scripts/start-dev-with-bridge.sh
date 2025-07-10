#!/bin/bash

# Start Development Environment với Cline-Augment Bridge

echo "🚀 Starting Development Environment with Cline-Augment Bridge..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
fi

# Check if Augment MCP is available
if [ ! -z "$AUGMENT_MCP_ENDPOINT" ]; then
    echo "🔍 Checking Augment MCP endpoint: $AUGMENT_MCP_ENDPOINT"
    
    # Test connection (optional)
    # curl -s "$AUGMENT_MCP_ENDPOINT/health" > /dev/null
    # if [ $? -eq 0 ]; then
    #     echo "✅ Augment MCP is available"
    # else
    #     echo "⚠️  Augment MCP not responding, using fallback mode"
    # fi
fi

# Start Cline-Augment Bridge in background
echo "🌉 Starting Cline-Augment Bridge..."
node scripts/cline-augment-bridge.js &
BRIDGE_PID=$!
echo "✅ Bridge started (PID: $BRIDGE_PID)"

# Start Next.js development server
echo "🚀 Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!
echo "✅ Next.js started (PID: $NEXTJS_PID)"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    if [ ! -z "$BRIDGE_PID" ]; then
        kill $BRIDGE_PID 2>/dev/null
        echo "✅ Bridge stopped"
    fi
    
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null
        echo "✅ Next.js stopped"
    fi
    
    echo "👋 Goodbye!"
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM

echo ""
echo "🎉 Development environment ready!"
echo "📋 Services running:"
echo "   - Next.js: http://localhost:3000 (or next available port)"
echo "   - Cline-Augment Bridge: Active"
echo "   - Task Directory: .cline-augment-tasks/"
echo ""
echo "💡 Usage:"
echo "   - Use Cline normally in Cursor"
echo "   - Requests matching patterns will auto-forward to Augment"
echo "   - Manual forward: npm run cline:forward \"description\" file.js"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
