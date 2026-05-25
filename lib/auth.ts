import bcrypt from "bcryptjs";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { query } from "@/lib/db";
import { ApiError, notFound } from "@/lib/errors";
import type { ApiKeyScope } from "@/lib/validators";

export type AuthContext = {
  keyId: string;
  label: string;
  scopes: ApiKeyScope[];
};

type ApiKeyRow = {
  id: string;
  label: string;
  key_hash: string;
  scopes: ApiKeyScope[] | null;
};

const keyPattern = /^tm_([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([A-Za-z0-9_-]{32,})$/i;

export function generatePlaintextApiKey(id = randomUUID()): { id: string; plaintextKey: string } {
  const secret = randomBytes(32).toString("base64url");
  return {
    id,
    plaintextKey: `tm_${id}.${secret}`
  };
}

export function parseApiKeyId(apiKey: string): string | null {
  return keyPattern.exec(apiKey)?.[1] ?? null;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, config.apiKeySaltRounds);
}

export async function createApiKey(input: {
  label: string;
  expires_at?: string | null;
  scopes: ApiKeyScope[];
}): Promise<{
  id: string;
  label: string;
  scopes: ApiKeyScope[];
  expires_at: string | null;
  plaintext_key: string;
  created_at: string;
}> {
  const { id, plaintextKey } = generatePlaintextApiKey();
  const keyHash = await hashApiKey(plaintextKey);

  const result = await query<{
    id: string;
    label: string;
    scopes: ApiKeyScope[];
    expires_at: Date | null;
    created_at: Date;
  }>(
    `insert into api_keys (id, label, key_hash, scopes, expires_at)
     values ($1, $2, $3, $4, $5)
     returning id, label, scopes, expires_at, created_at`,
    [id, input.label, keyHash, input.scopes, input.expires_at ?? null]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    label: row.label,
    scopes: row.scopes,
    expires_at: row.expires_at ? row.expires_at.toISOString() : null,
    plaintext_key: plaintextKey,
    created_at: row.created_at.toISOString()
  };
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const result = await query<{ id: string }>(
    `update api_keys
     set revoked_at = now()
     where id = $1 and revoked_at is null
     returning id`,
    [keyId]
  );

  if (result.rowCount === 0) {
    throw notFound("API key not found.");
  }
}

export async function authenticateRequest(
  request: NextRequest,
  requiredScopes: ApiKeyScope[] = []
): Promise<AuthContext> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    throw new ApiError(401, "UNAUTHORIZED", "X-API-Key header is required.");
  }

  const keyId = parseApiKeyId(apiKey);
  if (!keyId) {
    throw new ApiError(401, "UNAUTHORIZED", "API key is malformed.");
  }

  const result = await query<ApiKeyRow>(
    `select id, label, key_hash, scopes
     from api_keys
     where id = $1
       and revoked_at is null
       and (expires_at is null or expires_at > now())`,
    [keyId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new ApiError(401, "UNAUTHORIZED", "API key is invalid or expired.");
  }

  const matches = await bcrypt.compare(apiKey, row.key_hash);
  if (!matches) {
    throw new ApiError(401, "UNAUTHORIZED", "API key is invalid or expired.");
  }

  const scopes = row.scopes ?? [];
  const missingScope = requiredScopes.find((scope) => !scopes.includes(scope));
  if (missingScope) {
    throw new ApiError(403, "FORBIDDEN", `API key lacks required scope: ${missingScope}.`);
  }

  return {
    keyId: row.id,
    label: row.label,
    scopes
  };
}

export function requireAdminKey(request: NextRequest): void {
  const provided = request.headers.get("x-admin-key");
  if (!provided) {
    throw new ApiError(401, "UNAUTHORIZED", "X-Admin-Key header is required.");
  }

  if (!timingSafeStringEqual(provided, config.adminApiKey)) {
    throw new ApiError(403, "FORBIDDEN", "Admin key is invalid.");
  }
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
