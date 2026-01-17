#!/bin/bash
set -e

# Configuration
APP_DIR="/root/pdf-chinese-font-fixer"
REPO_URL="https://github.com/your-repo/pdf-chinese-font-fixer.git" # Replace with actual URL or use current dir if copying
FRONTEND_BUILD_DIR="/var/www/pdf-chinese-font-fixer/dist"

echo "=== Starting Deployment ==="

# 1. System Updates & Dependencies
echo "--> Updating system and installing dependencies..."
sudo apt-get update
sudo apt-get install -y nginx curl git unzip

# 2. Install UV (for Python)
if ! command -v uv &> /dev/null; then
    echo "--> Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/env 2>/dev/null || source $HOME/.local/bin/env 2>/dev/null || export PATH="$HOME/.local/bin:$PATH"
fi

# 3. Install Node.js 22 (using nvm or nodesource)
if ! command -v node &> /dev/null; then
    echo "--> Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 4. Project Setup
# Assuming the script is run from within the project directory or repo is cloned to APP_DIR
# If running locally to deploy to remote, this would be different.
# Here we assume we are ON the VPS and code is already here or we clone it.
# Let's assume code is in current directory.

CURRENT_DIR=$(pwd)
echo "--> Using current directory as source: $CURRENT_DIR"

# 5. Backend Setup
echo "--> Setting up Backend..."
cd "$CURRENT_DIR/backend"
# Create .env if not exists (User must edit this!)
if [ ! -f .env ]; then
    echo "Creating .env from example..."
    cp .env.example .env
    echo "WARNING: PLease edit backend/.env with your API keys!"
fi

# Install python deps
uv sync

# 6. Frontend Setup
echo "--> Setting up Frontend..."
cd "$CURRENT_DIR/frontend"
if [ ! -f .env ]; then
    echo "Creating .env from example..."
    cp .env.example .env
fi

npm install
npm run build

# 7. Nginx Setup
echo "--> Configuring Nginx..."
# Create directory for static files
sudo mkdir -p "$FRONTEND_BUILD_DIR"
# Copy build files
sudo cp -r dist/* "$FRONTEND_BUILD_DIR"
# Copy config
sudo cp "$CURRENT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/pdf-chinese-font-fixer
# Enable site
sudo ln -sf /etc/nginx/sites-available/pdf-chinese-font-fixer /etc/nginx/sites-enabled/
# sudo rm -f /etc/nginx/sites-enabled/default # COMMENTED OUT FOR SAFETY
sudo systemctl reload nginx

# 8. Systemd Setup
echo "--> Configuring Systemd..."
# Update service file with correct paths
sed "s|WorkingDirectory=.*|WorkingDirectory=$CURRENT_DIR/backend|g" "$CURRENT_DIR/deploy/backend.service" > /tmp/backend.service
sed -i "s|ExecStart=.*|ExecStart=$(which uv) run uvicorn app.main:app --host 0.0.0.0 --port 8000|g" /tmp/backend.service
sed -i "s|EnvironmentFile=.*|EnvironmentFile=$CURRENT_DIR/backend/.env|g" /tmp/backend.service

sudo mv /tmp/backend.service /etc/systemd/system/pdf-fixer.service
sudo systemctl daemon-reload
sudo systemctl enable pdf-fixer
sudo systemctl restart pdf-fixer

echo "=== Deployment Complete ==="
echo "1. Check backend status: systemctl status pdf-fixer"
echo "2. Edit .env files if needed"
echo "3. Visit http://$(curl -s ifconfig.me) to see your site"
