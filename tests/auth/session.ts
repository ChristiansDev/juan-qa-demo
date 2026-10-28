import path from 'path';

/** Session file written by tests/auth/<role>.setup.ts. Tests reuse it with test.use({ storageState }). */
export const sessionFile = (role: string): string => path.join('.auth', `${role}.json`);
