import type { BackupData, DriveBackupFile, AppSettings } from '@/types'
import { exportAllData, importAllData, clearAllData, setSetting, getSetting } from '@/lib/db'
import { downloadJSON, readFileAsText, now } from '@/lib/utils'

const BACKUP_FILE_PREFIX = 'minet-crm-backup'
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const GOOGLE_DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'

// ============================================================
// Create backup payload
// ============================================================
export async function createBackupPayload(): Promise<BackupData> {
  const data = await exportAllData()
  return {
    version: '1.0',
    appName: 'MiNet CRM',
    exportedAt: now(),
    data,
  }
}

// ============================================================
// Local Backup (file download)
// ============================================================
export async function backupToLocalFile(): Promise<void> {
  const payload = await createBackupPayload()
  const filename = `${BACKUP_FILE_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`

  // Try File System Access API first
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as Window & typeof globalThis & {
        showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle>
      }).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      })
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(payload, null, 2))
      await writable.close()
      return
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw Object.assign(new Error('cancelled'), { code: 'cancelled' })
      }
      // Fall through to blob download
    }
  }

  // Fallback: blob download
  downloadJSON(payload, filename)
}

// ============================================================
// Restore from local file
// ============================================================
export async function restoreFromLocalFile(file: File, merge = false): Promise<void> {
  const text = await readFileAsText(file)
  const payload = JSON.parse(text) as BackupData

  if (!payload.version || !payload.data) {
    throw new Error('File backup không hợp lệ')
  }

  if (!merge) {
    await clearAllData()
  }

  await importAllData(payload.data)
  await setSetting('lastBackupAt', now())
}

// ============================================================
// Google Drive Backup
// ============================================================
export async function backupToGoogleDrive(accessToken: string): Promise<DriveBackupFile> {
  const payload = await createBackupPayload()
  const filename = `${BACKUP_FILE_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`
  const jsonStr = JSON.stringify(payload, null, 2)

  const metadata = {
    name: filename,
    mimeType: 'application/json',
    appProperties: {
      backupType: 'minet-crm',
      version: payload.version,
    },
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', new Blob([jsonStr], { type: 'application/json' }))

  const response = await fetch(`${GOOGLE_DRIVE_UPLOAD_URL}?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Lỗi Google Drive: ${err}`)
  }

  return response.json() as Promise<DriveBackupFile>
}

// ============================================================
// List backups on Google Drive
// ============================================================
export async function listDriveBackups(accessToken: string): Promise<DriveBackupFile[]> {
  const q = encodeURIComponent(`appProperties has { key='backupType' and value='minet-crm' } and trashed=false`)
  const url = `${GOOGLE_DRIVE_FILES_URL}?q=${q}&orderBy=createdTime desc&pageSize=20&fields=files(id,name,createdTime,size)`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('Không thể lấy danh sách backup từ Drive')
  const data = await response.json() as { files: DriveBackupFile[] }
  return data.files ?? []
}

// ============================================================
// Restore from Google Drive
// ============================================================
export async function restoreFromGoogleDrive(fileId: string, accessToken: string, merge = false): Promise<void> {
  const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('Không thể tải backup từ Drive')

  const payload = await response.json() as BackupData
  if (!payload.version || !payload.data) throw new Error('File backup không hợp lệ')

  if (!merge) await clearAllData()
  await importAllData(payload.data)
  await setSetting('lastBackupAt', now())
}

// ============================================================
// Delete Drive backup file
// ============================================================
export async function deleteDriveBackup(fileId: string, accessToken: string): Promise<void> {
  const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok && response.status !== 204) {
    throw new Error('Không thể xóa backup')
  }
}

// ============================================================
// Prune old backups (keep only maxVersions)
// ============================================================
export async function pruneOldDriveBackups(accessToken: string, maxVersions: number): Promise<void> {
  if (maxVersions === 0) return
  const backups = await listDriveBackups(accessToken)
  const toDelete = backups.slice(maxVersions)
  for (const backup of toDelete) {
    await deleteDriveBackup(backup.id, accessToken)
  }
}

// ============================================================
// Auto Backup Scheduler
// ============================================================
function isBackupDue(lastBackupAt: string, frequency: AppSettings['autoBackupFrequency']): boolean {
  const last = new Date(lastBackupAt)
  const now = new Date()
  const daysDiff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  switch (frequency) {
    case 'daily': return daysDiff >= 1
    case 'weekly': return daysDiff >= 7
    case 'monthly': return daysDiff >= 30
    default: return false
  }
}

export async function checkAndRunAutoBackup(
  settings: AppSettings,
  googleAccessToken: string | null
): Promise<void> {
  if (!settings.autoBackupEnabled) return

  const lastBackupAt = await getSetting('lastBackupAt')
  if (lastBackupAt && !isBackupDue(lastBackupAt, settings.autoBackupFrequency)) return

  try {
    const dest = settings.autoBackupDestination
    if ((dest === 'drive' || dest === 'both') && googleAccessToken) {
      await backupToGoogleDrive(googleAccessToken)
      await pruneOldDriveBackups(googleAccessToken, settings.maxBackupVersions)
    }
    // Note: for 'local' destination, we can't auto-trigger a file picker without user gesture
    // We just record the backup time and let the user manually download
    await setSetting('lastBackupAt', now())
  } catch (err) {
    console.error('Auto backup failed:', err)
  }
}
