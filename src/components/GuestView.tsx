import { useStore } from "../store";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type GroupedBooking = {
  id: string;
  guestName: string;
  rooms: string[];
  checkIn: string;
  checkOut: string;
  status: "Đã đặt trước" | "Đã nhận phòng" | "Đã trả phòng";
};

export default function GuestView() {
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Xem theo khách đặt</h1>
        <p className="text-slate-500 text-sm mt-1">
          Danh sách khách hàng, đoàn khách và thông tin phòng
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Khách/ Đoàn khách</th>
                <th className="px-6 py-4">Phòng đặt</th>
                <th className="px-6 py-4">Ngày checkin</th>
                <th className="px-6 py-4">Ngày check-out</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Chưa có thông tin khách đặt nào
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {item.guestName || "Khách vô danh"}
                    </td>
                    <td className="px-6 py-4">
                      {item.rooms.sort().join(", ")}
                    </td>
                    <td className="px-6 py-4">{formatDate(item.checkIn)}</td>
                    <td className="px-6 py-4">{formatDate(item.checkOut)}</td>
                    <td className="px-6 py-4">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
