import { defineConfig, globalIgnores } from 'eslint/config';
import base from 'eslint-config-cheminfo-typescript/base';
import unicorn from 'eslint-config-cheminfo-typescript/unicorn';

export default defineConfig(globalIgnores(['coverage', 'lib']), base, unicorn);
