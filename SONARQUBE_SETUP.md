# SonarQube Local Development Setup

## Option A: Docker (Recommended)

```bash
# Pull and run SonarQube Community Edition
docker run -d --name sonarqube -p 9000:9000 sonarqube/community:latest

# Access SonarQube at http://localhost:9000
# Default login: admin/admin
```

## Option B: Download and Install

1. Download SonarQube Community Edition from https://www.sonarqube.org/downloads/
2. Follow the installation instructions for your operating system
3. Start the SonarQube server

## Local Analysis Commands

### Install SonarScanner

```bash
# Using npm
npm install -g sonar-scanner

# Or using Homebrew (macOS)
brew install sonar-scanner
```

### Run Local Analysis

```bash
# Navigate to your project directory
cd /Users/jatinbansal/Documents/Code/excel-explorer-website

# Run SonarScanner
sonar-scanner
```

### Run with Coverage

```bash
# Generate test coverage first
npm run test -- --coverage --coverage-reporters=lcov

# Then run SonarScanner
sonar-scanner
```

## Local Configuration

Create a `sonar-scanner.properties` file in your project root:

```
sonar.projectKey=excel-explorer-website-local
sonar.projectName=Excel Explorer Website (Local)
sonar.projectVersion=0.1.0
sonar.sources=src
sonar.tests=__tests__
sonar.sourceEncoding=UTF-8
sonar.host.url=http://localhost:9000
sonar.login=your-admin-token
```