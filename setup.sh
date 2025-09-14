#!/bin/bash

# Renovation Platform Setup Script
# This script helps set up the Supabase backend for the renovation platform

echo "🏗️  Renovation Platform - Supabase Backend Setup"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.local.example .env.local
    echo "✅ .env.local created from template"
    echo "⚠️  Please edit .env.local with your actual Supabase and Mailgun credentials"
else
    echo "✅ .env.local already exists"
fi

# Create messages directory if it doesn't exist
if [ ! -d messages ]; then
    echo "📁 Creating messages directory..."
    mkdir -p messages
    echo "✅ Messages directory created"
fi

# Check if messages files exist
if [ ! -f messages/en.json ]; then
    echo "📝 Creating English messages file..."
    echo '{"common": {"loading": "Loading..."}}' > messages/en.json
fi

if [ ! -f messages/ko.json ]; then
    echo "📝 Creating Korean messages file..."
    echo '{"common": {"loading": "로딩 중..."}}' > messages/ko.json
fi

echo "✅ Message files created"

# Create lib directory structure
echo "📁 Creating lib directory structure..."
mkdir -p lib/supabase
mkdir -p lib/types
echo "✅ Directory structure created"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Supabase and Mailgun credentials"
echo "2. Run the SQL commands in supabase-setup.sql in your Supabase dashboard"
echo "3. Configure authentication providers in Supabase"
echo "4. Start the development server with: npm run dev"
echo ""
echo "📚 For detailed instructions, see README.md"
echo ""
echo "🔗 Useful links:"
echo "- Supabase Dashboard: https://supabase.com/dashboard"
echo "- Supabase Docs: https://supabase.com/docs"
echo "- Next.js Docs: https://nextjs.org/docs"
echo ""
echo "Happy coding! 🚀"
