# Sonar Analysis Setup Guide

This guide will help you set up SonarQube/SonarCloud analysis for your Excel Explorer Website project.

## 🚀 Quick Start - SonarCloud (Recommended)

### 1. Connect to SonarCloud

1. Go to [SonarCloud.io](https://sonarcloud.io/)
2. Sign in with your GitHub account
3. Click "Analyze new project"
4. Select your `excel-explorer-website` repository
5. Follow the setup wizard

### 2. Configure GitHub Secrets

In your GitHub repository settings, add these secrets:

- `SONAR_TOKEN`: Get this from SonarCloud after connecting your repository
- `GITHUB_TOKEN`: This is automatically available in GitHub Actions

### 3. Run Analysis

The GitHub Actions workflow will automatically run on:

- Pushes to `main` and `staging` branches
- Pull requests targeting `main` and `staging` branches

## 🏠 Local Development - SonarQube

### Option A: Docker Setup (Recommended)

```bash
# Start SonarQube locally
docker run -d --name sonarqube -p 9000:9000 sonarqube/community:latest

# Access at http://localhost:9000
# Default credentials: admin/admin
```

### Option B: Direct Installation

1. Download from [sonarqube.org/downloads](https://www.sonarqube.org/downloads/)
2. Follow installation instructions
3. Start the server

### Local Analysis Commands

```bash
# Install SonarScanner
npm install -g sonar-scanner

# Generate coverage report
npm run test:coverage

# Run Sonar analysis
sonar-scanner
```

## 📊 Current Project Configuration

Your project is already configured with:

- ✅ **SonarCloud configuration** (`sonar-project.properties`)
- ✅ **GitHub Actions workflow** (`.github/workflows/sonarcloud.yml`)
- ✅ **Test coverage setup** (Jest with lcov reports)
- ✅ **Quality gates enabled**
- ✅ **Proper exclusions for non-source files**

## 🔍 Analysis Results

Sonar will analyze:

- **Code Quality**: Bugs, vulnerabilities, code smells
- **Test Coverage**: Unit test coverage reports
- **Security**: Security hotspots and vulnerabilities
- **Maintainability**: Code duplication, complexity, technical debt
- **Reliability**: Error-prone code patterns

## 📈 Key Metrics Tracked

### Quality Gates

- **Coverage**: > 80% (configurable)
- **Duplicated Lines**: < 3%
- **Maintainability Rating**: A (no technical debt)
- **Reliability Rating**: A (no bugs)
- **Security Rating**: A (no vulnerabilities)

### Code Coverage

Your project is configured to collect coverage from:

- All TypeScript/JavaScript files in `src/`
- Excluding test files, stories, and type definitions
- Minimum thresholds: 60% across all metrics

## 🛠️ Running Analysis Locally

### Before Running Analysis

```bash
# Install dependencies
npm install

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Run linting
npm run lint
```

### Run SonarScanner

```bash
# From project root
sonar-scanner
```

## 🔧 Troubleshooting

### Common Issues

1. **Coverage report not found**: Run `npm run test:coverage` first
2. **Authentication errors**: Check SONAR_TOKEN in GitHub secrets
3. **Missing files**: Verify `sonar.sources` and `sonar.tests` paths
4. **Memory issues**: Increase SonarQube memory for large projects

### Debug Mode

```bash
# Run with verbose output
sonar-scanner -X
```

## 📋 Next Steps

1. **Choose your preferred option** (SonarCloud or local SonarQube)
2. **Complete the setup** using the appropriate guide above
3. **Run your first analysis**
4. **Review the results** and address any issues found
5. **Set up quality gates** in your Sonar dashboard

## 🎯 Benefits

- **Continuous Quality Monitoring**: Automated code quality checks
- **Security Scanning**: Detection of security vulnerabilities
- **Technical Debt Tracking**: Monitor and reduce technical debt
- **Coverage Tracking**: Ensure adequate test coverage
- **Integration**: Works seamlessly with your existing CI/CD pipeline

Your project is now ready for Sonar analysis! 🎉