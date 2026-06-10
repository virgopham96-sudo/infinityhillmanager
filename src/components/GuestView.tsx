import { useStore } from "../store";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

type GroupedBooking = {
  id: string;
  guestName: string;
  rooms: string[];
  checkIn: string;
  checkOut: string;
  status: "Đã đặt trước" | "Đã nhận phòng" | "Đã trả phòng";
};

interface GuestViewProps {
  onEditGroup?: (guestName: string) => void;
}

export default function GuestView({ onEditGroup }: GuestViewProps) {
  const { rooms, bookings } = useStore();

  const getGroupedBookings = () => {
    const rawEntries: {
      guestName: string;
      roomId: string;
      checkIn: string;
      checkOut: string;
      status: "Đã đặt trước" | "Đã nhận phòng" | "Đã trả phòng";
    }[] = [];

    rooms.forEach((room) => {
      if (room.status === "occupied" && room.guestName) {
        rawEntries.push({
          guestName: room.guestName,
          roomId: room.id,
          checkIn: room.checkInTime || "",
          checkOut: room.checkOutTime || "",
          status: "Đã nhận phòng",
        });
      } else if (room.status === "reserved" && room.guestName) {
        rawEntries.push({
          guestName: room.guestName,
          roomId: room.id,
          checkIn: room.checkInTime || "",
          checkOut: room.checkOutTime || "",
          status: "Đã đặt trước",
        });
      }

      if (room.reservations) {
        room.reservations.forEach((res) => {
          rawEntries.push({
            guestName: res.guestName,
            roomId: room.id,
            checkIn: res.checkInTime,
            checkOut: res.checkOutTime,
            status: "Đã đặt trước",
          });
        });
      }
    });

    bookings.forEach((b) => {
      if (b.status === "completed") {
        rawEntries.push({
          guestName: b.guestName,
          roomId: b.roomId,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: "Đã trả phòng",
        });
      }
    });

    const grouped: Record<string, GroupedBooking> = {};
    rawEntries.forEach((entry) => {
      // Create a unique key for grouping. Ignore time differences by looking at date string 
      // but here we just use the ISO string if they match exactly.
      const inDate = entry.checkIn ? new Date(entry.checkIn).toDateString() : "";
      const outDate = entry.checkOut ? new Date(entry.checkOut).toDateString() : "";
      
      const key = `${entry.guestName}_${inDate}_${outDate}_${entry.status}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          guestName: entry.guestName,
          rooms: [entry.roomId],
          checkIn: entry.checkIn,
          checkOut: entry.checkOut,
          status: entry.status,
        };
      } else {
        if (!grouped[key].rooms.includes(entry.roomId)) {
          grouped[key].rooms.push(entry.roomId);
        }
      }
    });

    return Object.values(grouped).sort((a, b) => {
      if (!a.checkIn) return 1;
      if (!b.checkIn) return -1;
      return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
    });
  };

  const data = getGroupedBookings();

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      return format(new Date(isoString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return "-";
    }
  };

  const getRoomTypesCount = (roomIds: string[]) => {
    const counts: Record<string, number> = {};
    roomIds.forEach(id => {
      const r = rooms.find(room => room.id === id);
      if (r) {
        counts[r.type] = (counts[r.type] || 0) + 1;
      }
    });
    const typesString = Object.entries(counts)
      .map(([type, count]) => `${count} ${type}`)
      .join(", ");
    return { total: roomIds.length, typesString };
  };

  const handleExportExcel = () => {
    const exportData = data.map((item, index) => {
      const { total, typesString } = getRoomTypesCount(item.rooms);
      const inDate = formatDate(item.checkIn);
      const outDate = formatDate(item.checkOut);
      const totalDays = item.checkIn && item.checkOut 
        ? Math.max(1, Math.ceil(Math.abs(new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime()) / (1000 * 60 * 60 * 24))) 
        : "-";

      return {
        "STT": index + 1,
        "Khách / Đoàn khách": item.guestName || "Khách vô danh",
        "Tổng số phòng": total,
        "Loại phòng": typesString || "",
        "Phòng đặt": item.rooms.sort().join(", "),
        "Ngày check-in": inDate,
        "Ngày check-out": outDate,
        "Tổng số ngày": totalDays,
        "Trạng thái": item.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khach_Dat");
    
    // Auto-adjust column widths
    const max_len = exportData.reduce((prev: any, next: any) => {
      Object.keys(next).forEach((key) => {
        const val = String(next[key] || "");
        prev[key] = Math.max(prev[key] || 0, val.length, key.length);
      });
      return prev;
    }, {});
    
    worksheet["!cols"] = Object.keys(max_len).map((key) => ({
      wch: Math.max(max_len[key] + 3, 10),
    }));

    XLSX.writeFile(workbook, `Danh_sach_khach_dat_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Xem theo khách đặt</h1>
          <p className="text-slate-500 text-sm mt-1">
            Danh sách khách hàng, đoàn khách và thông tin phòng
          </p>
        </div>
        {data.length > 0 && (
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            Tải Excel danh sách
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 whitespace-nowrap min-w-[180px]">Khách/ Đoàn khách</th>
                <th className="px-4 py-4 whitespace-nowrap min-w-[150px]">Tổng số phòng</th>
                <th className="px-4 py-4 min-w-[200px]">Phòng đặt</th>
                <th className="px-4 py-4 whitespace-nowrap min-w-[150px]">Ngày check-in</th>
                <th className="px-4 py-4 whitespace-nowrap min-w-[150px]">Ngày check-out</th>
                <th className="px-4 py-4 whitespace-nowrap min-w-[150px]">Tổng số ngày</th>
                <th className="px-4 py-4 whitespace-nowrap min-w-[150px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Chưa có thông tin khách đặt nào
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const { total, typesString } = getRoomTypesCount(item.rooms);
                  return (
                  <tr 
                    key={item.id} 
                    className={`transition-colors ${onEditGroup ? "hover:bg-slate-50 cursor-pointer" : ""}`}
                    onClick={() => {
                        if (onEditGroup && item.status !== "Đã trả phòng") {
                            onEditGroup(item.guestName);
                        }
                    }}
                  >
                    <td className="px-4 py-4 font-medium text-slate-800 whitespace-nowrap">
                      {item.guestName || "Khách vô danh"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{total}</div>
                      {typesString && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          ({typesString})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.rooms.sort().map((roomId) => (
                          <span key={roomId} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-xs border border-slate-200">
                            {roomId}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(item.checkIn)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(item.checkOut)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {item.checkIn && item.checkOut ? Math.max(1, Math.ceil(Math.abs(new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime()) / (1000 * 60 * 60 * 24))) : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full uppercase tracking-wider ${
                          item.status === "Đã nhận phòng"
                            ? "bg-rose-100 text-rose-700"
                            : item.status === "Đã đặt trước"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
