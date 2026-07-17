function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`${key} must be set before starting the app`);
  }

  return value;
}

export const env = {
  apiUrl: requireEnv('VITE_API_URL'),
} as const;
