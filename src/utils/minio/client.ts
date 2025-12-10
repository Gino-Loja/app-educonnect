import { Client } from "minio"

const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
} = process.env

let cachedClient: Client | null = null

function assertConfig(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} environment variable for MinIO`)
  }
  return value
}

/**
 * Server-side MinIO client. Use only in server components, route handlers o server actions.
 */
export function getMinioClient() {
  if (cachedClient) return cachedClient

  cachedClient = new Client({
    endPoint: assertConfig(MINIO_ENDPOINT, "MINIO_ENDPOINT"),
    port: Number(MINIO_PORT) || 443,
    useSSL: (MINIO_USE_SSL || "false").toLowerCase() === "true",
    accessKey: assertConfig(MINIO_ACCESS_KEY, "MINIO_ACCESS_KEY"),
    secretKey: assertConfig(MINIO_SECRET_KEY, "MINIO_SECRET_KEY"),
  })

  return cachedClient
}
