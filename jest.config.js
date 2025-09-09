module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: [
        '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js)',
        '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
        '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    },
    transformIgnorePatterns: [
        '/node_modules/',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg)$': '<rootDir>/__tests__/utils/fileMock.js',
    },
    globals: {
        'ts-jest': {
            tsconfig: {
                jsx: 'react-jsx',
            },
        },
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/index.{ts,tsx}',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 10000,
    verbose: true,
    detectOpenHandles: true,
    forceExit: true,
}
