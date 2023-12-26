import type { Config } from 'jest';
import { defaults } from 'jest-config';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['<rootDir>/__tests__/__mocks__/', '<rootDir>/__tests__/settings/'],
  setupFiles: ['<rootDir>/__tests__/settings/env-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/settings/jest.setup.ts'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts'],
};

export default config;
