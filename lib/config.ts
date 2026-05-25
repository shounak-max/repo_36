export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export function requireEnv(name: string): string {
  const value = getOptionalEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getNumberEnv(name: string, fallback: number, minimum = 0): number {
  const raw = getOptionalEnv(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`${name} must be a number greater than or equal to ${minimum}`);
  }

  return parsed;
}

export const config = {
  get postgresUrl() {
    return requireEnv("POSTGRES_URL");
  },
  get postgresUrlNonPooling() {
    return getOptionalEnv("POSTGRES_URL_NON_POOLING") ?? requireEnv("POSTGRES_URL");
  },
  get adminApiKey() {
    return requireEnv("ADMIN_API_KEY");
  },
  get apiKeySaltRounds() {
    return getNumberEnv("API_KEY_SALT_ROUNDS", 12, 12);
  },
  get rateLimitWindowMs() {
    return getNumberEnv("RATE_LIMIT_WINDOW_MS", 60_000, 1_000);
  },
  get rateLimitMax() {
    return getNumberEnv("RATE_LIMIT_MAX", 100, 1);
  }
};
