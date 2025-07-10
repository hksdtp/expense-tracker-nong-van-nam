#!/bin/bash

# Setup script cho Cline-Augment integration

echo "🚀 Setting up Cline-Augment Bridge..."

# Tạo directories cần thiết
mkdir -p .cline-augment-tasks
mkdir -p .cline/prompts

# Make bridge script executable
chmod +x scripts/cline-augment-bridge.js

# Tạo Cline prompt template
cat > .cline/prompts/forward-to-augment.md << 'EOF'
# Forward to Augment

This task will be forwarded to Augment for processing.

## Task Description
{{description}}

## Files Involved
{{files}}

## Context
{{context}}

## Instructions for Augment
Please process this request using your advanced codebase understanding and implementation capabilities.

---
*This task was automatically forwarded from Cline to Augment*
EOF

# Tạo package.json script
if [ -f package.json ]; then
    echo "📦 Adding npm scripts..."
    
    # Backup package.json
    cp package.json package.json.backup
    
    # Add scripts using jq if available
    if command -v jq &> /dev/null; then
        jq '.scripts["cline:bridge"] = "node scripts/cline-augment-bridge.js"' package.json > package.json.tmp
        jq '.scripts["cline:forward"] = "node scripts/cline-augment-bridge.js create-task"' package.json.tmp > package.json
        rm package.json.tmp
    else
        echo "⚠️  jq not found. Please manually add these scripts to package.json:"
        echo '  "cline:bridge": "node scripts/cline-augment-bridge.js"'
        echo '  "cline:forward": "node scripts/cline-augment-bridge.js create-task"'
    fi
fi

# Tạo VS Code task
mkdir -p .vscode
cat > .vscode/tasks.json << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Cline-Augment Bridge",
            "type": "shell",
            "command": "node",
            "args": ["scripts/cline-augment-bridge.js"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new"
            },
            "runOptions": {
                "runOn": "folderOpen"
            }
        },
        {
            "label": "Forward Task to Augment",
            "type": "shell",
            "command": "node",
            "args": [
                "scripts/cline-augment-bridge.js",
                "create-task",
                "${input:taskDescription}",
                "${input:files}"
            ],
            "group": "build"
        }
    ],
    "inputs": [
        {
            "id": "taskDescription",
            "description": "Task description",
            "default": "Implement feature",
            "type": "promptString"
        },
        {
            "id": "files",
            "description": "Files to include",
            "default": "",
            "type": "promptString"
        }
    ]
}
EOF

echo "✅ Cline-Augment Bridge setup completed!"
echo ""
echo "📋 Usage:"
echo "  1. Start bridge: npm run cline:bridge"
echo "  2. Forward task: npm run cline:forward \"description\" file1.js file2.js"
echo "  3. Or use VS Code Command Palette: 'Tasks: Run Task' → 'Start Cline-Augment Bridge'"
echo ""
echo "🔧 Configuration:"
echo "  - Tasks directory: .cline-augment-tasks/"
echo "  - Config file: .cline/config.json"
echo "  - Bridge script: scripts/cline-augment-bridge.js"
echo ""
echo "🎯 Next steps:"
echo "  1. Configure your Augment CLI/API endpoint in the bridge script"
echo "  2. Test the integration with a simple task"
echo "  3. Customize forwarding patterns in .cline/config.json"
