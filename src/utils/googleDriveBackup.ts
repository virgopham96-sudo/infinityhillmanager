import { db, getAccessToken } from "../firebase";
import { doc, setDoc, getDoc, getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { Room, BookingRecord } from "../types";

const BACKUP_FOLDER_ID = "1w5WYFR49UWutPrU1093qc3HtqsWZa9lD";

// Interface for Backup log
export interface BackupLog {
  id: string; // slotId e.g. "2026-06-22-10h"
  fileName: string;
  fileId?: string;
  timestamp: string;
  success: boolean;
  error?: string | null;
  operatorEmail?: string | null;
}

/**
 * Uploads a string content to Google Drive inside the specific folder
 */
export async function uploadToGoogleDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType = "application/json"
): Promise<string> {
  // Step 1: Create metadata (multipart/json file declaration)
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [BACKUP_FOLDER_ID],
  };

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Tạo siêu dữ liệu tệp thất bại: ${errorText}`);
  }

  const fileData = await createRes.json();
  const fileId = fileData.id;

  if (!fileId) {
    throw new Error("Không nhận được mã ID tệp từ Google Drive");
  }

  // Step 2: Upload the actual content bytes via PATCH media endpoint
  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
      },
      body: content,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Tải tệp tin lên Drive thất bại: ${errorText}`);
  }

  return fileId;
}

/**
 * Runs the automatic backup logic based on current hour and date
 */
export async function runAutoBackupDirectly(
  rooms: Room[],
  bookings: BookingRecord[],
  hotelName: string,
  userEmail: string | null = null,
  force = false
): Promise<{ success: boolean; slot: string; message: string; fileId?: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, slot: "", message: "Chưa kết nối tài khoản Google Drive" };
  }

  // Calculate current slot
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${date}`;
  const hour = now.getHours();

  // If not force, check if we are in valid backup hours
  let activeSlot = "";
  if (hour >= 10 && hour < 18) {
    activeSlot = `${dateStr}-10h`;
  } else if (hour >= 18 || hour < 10) {
    // If it's before 10 AM, we are either in yesterday's PM slot or current day's waiting state.
    // Let's mark it as -18h.
    activeSlot = hour < 10 
      ? `${getPreviousDayDateStr(now)}-18h`
      : `${dateStr}-18h`;
  }

  if (!activeSlot && !force) {
    return { success: false, slot: "", message: "Không nằm trong thời gian sao lưu tự động" };
  }

  const slotId = force ? `manual-${Date.now()}` : activeSlot;

  // Check if slot has already been successfully backed up in Firestore
  if (!force) {
    try {
      const docRef = doc(db, "backup_logs", slotId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().success) {
        return { 
          success: true, 
          slot: slotId, 
          message: `Sao lưu khe ${slotId} đã được thực hiện trước đó` 
        };
      }
    } catch (e) {
      console.error("Lỗi kiểm tra log sao lưu:", e);
    }
  }

  // Run upload
  const cleanHotelName = hotelName.trim() || "Infinity Hill";
  const label = force ? "manual" : (hour >= 10 && hour < 18 ? "10h_sang" : "18h_toi");
  const fileName = `${cleanHotelName.replace(/[^a-zA-Z0-9_đĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ\s]/g, "").replace(/\s+/g, "_")}_backup_${dateStr}_${label}.json`;

  const backupPayload = {
    rooms,
    bookings,
    hotelName: cleanHotelName,
    backupType: force ? "manual" : "automatic",
    slot: activeSlot,
    generatedAt: now.toISOString(),
  };

  try {
    const fileId = await uploadToGoogleDrive(accessToken, fileName, JSON.stringify(backupPayload, null, 2));

    // Save log to Firestore
    const logData: BackupLog = {
      id: slotId,
      fileName,
      fileId,
      timestamp: now.toISOString(),
      success: true,
      operatorEmail: userEmail,
    };
    await setDoc(doc(db, "backup_logs", slotId), logData);

    return { 
      success: true, 
      slot: slotId, 
      message: `Đã kết nối và tự động tải tập tin lên thư mục Google Drive thành công!`,
      fileId 
    };
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    console.error("Drive upload crash:", errorMessage);

    // Record failure in Firestore
    const logData: BackupLog = {
      id: slotId,
      fileName,
      timestamp: now.toISOString(),
      success: false,
      error: errorMessage,
      operatorEmail: userEmail,
    };
    await setDoc(doc(db, "backup_logs", slotId), logData);

    return { 
      success: false, 
      slot: slotId, 
      message: `Lỗi tải lên Google Drive: ${errorMessage}` 
    };
  }
}

/**
 * Fetch backup history logs from Firestore
 */
export async function fetchBackupLogs(): Promise<BackupLog[]> {
  try {
    const backupLogsRef = collection(db, "backup_logs");
    const snap = await getDocs(backupLogsRef);
    const logs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as BackupLog);
    // Sort descending by timestamp
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error("Lỗi lấy lịch sử sao lưu:", e);
    return [];
  }
}

function getPreviousDayDateStr(d: Date): string {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  const year = prev.getFullYear();
  const month = String(prev.getMonth() + 1).padStart(2, "0");
  const date = String(prev.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}
