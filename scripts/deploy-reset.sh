#!/bin/bash

# Deploy script for Render with database reset
# This script will completely reset the database and apply the new schema

echo "🚀 Starting deployment with database reset..."

# Set production environment
export NODE_ENV=production

echo "📦 Installing dependencies..."
npm ci --only-production

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "⚠️  RESETTING DATABASE - All existing data will be deleted!"
echo "This will:"
echo "- Drop all existing tables"
echo "- Create tables with the new schema"
echo "- Apply all migrations"

# Reset database (drops all tables and recreates them)
echo "🗃️  Resetting database schema..."
npx prisma db push --force-reset

echo "✅ Database reset completed successfully!"

echo "🎯 Starting application..."
npm run start:prod