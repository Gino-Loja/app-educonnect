import { getMinioClient } from "@/utils/minio/client"

const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7 // 7 days

const ensureBucket = async (bucket: string) => {
  const minio = getMinioClient()
  const exists = await minio.bucketExists(bucket).catch(() => false)
  if (!exists) {
    await minio.makeBucket(bucket, "")
  }
}

const sanitizeFileName = (name: string) => (name || "file").replace(/[^a-zA-Z0-9._-]/g, "_")

export async function uploadToMinio(options: {
  bucket: string
  file: File
  objectName?: string
}): Promise<{ objectName: string; signedUrl: string }> {
  const minio = getMinioClient()
  const objectName =
    options.objectName ||
    `${Date.now()}-${sanitizeFileName((options.file as File).name || "file")}`.replace(/\s+/g, "_")

  await ensureBucket(options.bucket)

  const arrayBuffer = await options.file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await minio.putObject(options.bucket, objectName, buffer, buffer.length, {
    "Content-Type": (options.file as File).type || "application/octet-stream",
  })

  const signedUrl = await minio.presignedGetObject(
    options.bucket,
    objectName,
    DEFAULT_EXPIRY_SECONDS,
  )

  return { objectName, signedUrl }
}

export async function deleteFromMinio(bucket: string, objectName: string) {
  const minio = getMinioClient()
  try {
    await minio.removeObject(bucket, objectName)
  } catch (error) {
    console.warn("deleteFromMinio warning", error)
  }
}

export function parseObjectName(fullPath: string): { bucket: string; objectName: string } | null {
  try {
    const url = new URL(fullPath)
    const parts = url.pathname.replace(/^\//, "").split("/")
    const [bucket, ...rest] = parts
    if (!bucket || rest.length === 0) return null
    return { bucket, objectName: rest.join("/") }
  } catch {
    const [bucket, ...rest] = fullPath.split("/")
    if (!bucket || rest.length === 0) return null
    return { bucket, objectName: rest.join("/") }
  }
}

export async function signMinioUrl(fullPath: string, expirySeconds: number = DEFAULT_EXPIRY_SECONDS) {
  const parsed = parseObjectName(fullPath)
  if (!parsed) return null
  const minio = getMinioClient()
  try {
    return await minio.presignedGetObject(parsed.bucket, parsed.objectName, expirySeconds)
  } catch (error) {
    console.error("signMinioUrl error", error)
    return null
  }
}
