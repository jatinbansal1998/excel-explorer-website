#!/bin/bash

# SonarQube Analysis Test Script
# This script helps test your SonarQube configuration locally

echo "🔍 Testing SonarQube Configuration..."
echo "================================"

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo "❌ sonar-scanner is not installed. Please install it first:"
    echo "   npm install -g sonar-scanner"
    echo "   or"
    echo "   brew install sonar-scanner"
    exit 1
fi

# Check if coverage report exists
if [ ! -f "coverage/lcov.info" ]; then
    echo "⚠️  Coverage report not found. Generating coverage..."
    npm run test:coverage -- --coverage-reporters=lcov --silent
fi

# Check if sonar-project.properties exists
if [ ! -f "sonar-project.properties" ]; then
    echo "❌ sonar-project.properties not found!"
    exit 1
fi

echo "✅ Configuration files found"
echo "✅ Coverage report found"
echo "✅ sonar-scanner is installed"

# Display current configuration
echo ""
echo "📋 Current Configuration:"
echo "========================"
echo "Project Key: $(grep 'sonar.projectKey' sonar-project.properties | cut -d'=' -f2)"
echo "Sources: $(grep 'sonar.sources' sonar-project.properties | cut -d'=' -f2)"
echo "Tests: $(grep 'sonar.tests' sonar-project.properties | cut -d'=' -f2)"
echo "JS Files: $(grep 'sonar.javascript.file.suffixes' sonar-project.properties | cut -d'=' -f2)"
echo "TS Files: $(grep 'sonar.typescript.file.suffixes' sonar-project.properties | cut -d'=' -f2)"

echo ""
echo "🚀 Ready to run SonarQube analysis!"
echo ""
echo "To run analysis:"
echo "  sonar-scanner"
echo ""
echo "To run with debug output:"
echo "  sonar-scanner -X"
echo ""
echo "To run against local SonarQube instance:"
echo "  sonar-scanner -Dsonar.host.url=http://localhost:9000"