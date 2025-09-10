#!/bin/bash

# SonarQube Staging Branch Analysis Script
# This script runs Sonar analysis specifically on the staging branch

echo "🌿 SonarQube Staging Branch Analysis"
echo "====================================="

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "staging" ]; then
    echo "⚠️  You are currently on '$CURRENT_BRANCH' branch"
    read -p "Do you want to switch to staging branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Switching to staging branch..."
        git checkout staging
        git pull origin staging
    else
        echo "❌ Aborting. Please switch to staging branch manually."
        exit 1
    fi
fi

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo "❌ sonar-scanner is not installed. Please install it first:"
    echo "   npm install -g sonar-scanner"
    exit 1
fi

# Check if coverage report exists
if [ ! -f "coverage/lcov.info" ]; then
    echo "📊 Generating coverage report..."
    npm run test:coverage -- --coverage-reporters=lcov --silent
fi

# Check which Sonar configuration to use
if [ -f "sonar-project-staging.properties" ]; then
    CONFIG_FILE="sonar-project-staging.properties"
    echo "📋 Using staging-specific configuration"
else
    CONFIG_FILE="sonar-project.properties"
    echo "📋 Using default configuration"
fi

echo "✅ Configuration: $CONFIG_FILE"
echo "✅ Coverage report: coverage/lcov.info"
echo "✅ Branch: staging"

# Display configuration
echo ""
echo "📋 Analysis Configuration:"
echo "========================="
echo "Branch: staging"
echo "Config File: $CONFIG_FILE"
if [ "$CONFIG_FILE" = "sonar-project-staging.properties" ]; then
    echo "Project Key: $(grep 'sonar.projectKey' $CONFIG_FILE | cut -d'=' -f2)"
    echo "Project Name: $(grep 'sonar.projectName' $CONFIG_FILE | cut -d'=' -f2)"
else
    echo "Project Key: excel-explorer-website (staging branch)"
    echo "Project Name: Excel Explorer Website (staging branch)"
fi

echo ""
echo "🚀 Starting SonarQube analysis on staging branch..."
echo ""

# Run Sonar analysis with branch parameter
if [ "$CONFIG_FILE" = "sonar-project-staging.properties" ]; then
    sonar-scanner -Dproject.settings=$CONFIG_FILE
else
    sonar-scanner -Dsonar.branch.name=staging
fi

echo ""
echo "✅ Analysis complete!"
echo ""
echo "🔍 View results at:"
echo "   SonarCloud: https://sonarcloud.io/dashboard?id=excel-explorer-website"
echo "   (or your local SonarQube instance if running locally)"