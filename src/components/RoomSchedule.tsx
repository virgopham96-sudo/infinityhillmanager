import { useState, useMemo } from "react";
import { Room } from "../types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfDay,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "../lib/utils";

interface RoomScheduleProps {
  rooms: Room[];
  onBookRoom?: (roomId: string, date: Date) => void;
}

export default function RoomSchedule({ rooms, onBookRoom }: RoomScheduleProps) {
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const [selectedGuestInfo, setSelectedGuestInfo] = useState<{
    room: string;
    date: Date;
    guestName?: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
  } | null>(null);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Determine occupancy for a room on a given day
  const getCellData = (room: Room, date: Date) => {
    const checkDate = startOfDay(date);

    // Check main status
    if (room.status === "occupied" || room.status === "reserved") {
      if (room.checkInTime && room.checkOutTime) {
        const inDate = startOfDay(parseISO(room.checkInTime));
        const outDate = startOfDay(parseISO(room.checkOutTime));

        // A booking occupies the room from inDate up to (but not including) outDate
        // However, if inDate === outDate, it's a day use
        if (checkDate >= inDate && checkDate < outDate) {
          return {
            status: room.status,
            guestName: room.guestName,
            checkIn: room.checkInTime,
            checkOut: room.checkOutTime,
          };
        }
      }
    }

    // Check future reservations
    if (room.reservations) {
      for (const res of room.reservations) {
        const inDate = startOfDay(parseISO(res.checkInTime));
        const outDate = startOfDay(parseISO(res.checkOutTime));
        if (checkDate >= inDate && checkDate < outDate) {
          return {
            status: "reserved",
            guestName: res.guestName,
            checkIn: res.checkInTime,
            checkOut: res.checkOutTime,
          };
        }
      }
    }

    // Check maintenance (if it's currently maintenance, show it from checkInTime onwards)
    if (room.status === "maintenance") {
      const today = startOfDay(new Date());
      const startDate = room.checkInTime
        ? startOfDay(parseISO(room.checkInTime))
        : today;
      if (checkDate >= startDate) {
        return { status: "maintenance" };
      }
    }

    return { status: "available" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500";
      case "occupied":
        return "bg-rose-500";
      case "reserved":
        return "bg-amber-400";
      case "maintenance":
        return "bg-slate-900";
      default:
        return "bg-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header Month Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b border-slate-100 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight min-w-[150px] text-center uppercase">
            THÁNG {format(currentDate, "M")}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600 w-full md:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Trống
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-rose-500"></span> Đang sử dụng
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-amber-400"></span> Đã đặt trước
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-slate-900"></span> Bảo trì
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
            <tr>
              <th className="sticky left-0 bg-slate-50 p-2 md:p-3 text-xs md:text-sm font-semibold text-slate-700 border-b border-r border-slate-200 w-16 md:w-24 z-20 shadow-sm">
                Số phòng
              </th>
              {daysInMonth.map((day) => {
                const stats = rooms.reduce(
                  (acc, room) => {
                    const status = getCellData(room, day).status;
                    if (status === "available") acc.available++;
                    else if (status === "occupied") acc.occupied++;
                    else if (status === "reserved") acc.reserved++;
                    else if (status === "maintenance") acc.maintenance++;
                    return acc;
                  },
                  { available: 0, occupied: 0, reserved: 0, maintenance: 0 },
                );

                return (
                  <th
                    key={day.toISOString()}
                    className="p-1 md:p-2 text-xs md:text-sm font-medium text-slate-600 border-b border-r border-slate-200 text-center min-w-[28px] md:min-w-[36px] relative group cursor-help"
                  >
                    <span>{format(day, "d")}</span>
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block w-36 bg-slate-800 text-white text-xs rounded-md shadow-xl p-2.5 text-left font-normal flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Trống:</span>
                        <span className="font-semibold text-emerald-400">{stats.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Đang ở:</span>
                        <span className="font-semibold text-rose-400">{stats.occupied}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Đã đặt:</span>
                        <span className="font-semibold text-amber-400">{stats.reserved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Bảo trì:</span>
                        <span className="font-semibold text-slate-400">{stats.maintenance}</span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50">
                  <td className="sticky left-0 bg-white font-bold text-slate-800 p-2 md:p-3 text-xs md:text-sm border-r border-slate-200 z-10">
                    {room.id}
                  </td>
                  {daysInMonth.map((day) => {
                    const cellData = getCellData(room, day);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <td
                        key={day.toISOString()}
                        className={cn(
                          "border-r border-slate-200 p-0.5 md:p-1 cursor-pointer transition-colors relative group",
                          isToday && "bg-blue-50/30",
                        )}
                        onClick={() => {
                          if (
                            cellData.status !== "available" &&
                            cellData.status !== "maintenance"
                          ) {
                            setSelectedGuestInfo({
                              room: room.id,
                              date: day,
                              guestName: cellData.guestName,
                              status: cellData.status,
                              checkIn: cellData.checkIn,
                              checkOut: cellData.checkOut,
                            });
                          } else if (cellData.status === "available" && onBookRoom) {
                            onBookRoom(room.id, day);
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "w-full h-6 md:h-8 rounded-sm shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]",
                            getStatusColor(cellData.status),
                            (cellData.status === "occupied" ||
                              cellData.status === "reserved") &&
                              "hover:opacity-80",
                          )}
                        ></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Guest Info Modal/Popup */}
      {selectedGuestInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
          onClick={() => setSelectedGuestInfo(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">
                Chi tiết phòng {selectedGuestInfo.room}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">
                    Khách hàng
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedGuestInfo.guestName || "Không rõ"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in:</span>
                  <span className="font-medium text-slate-700">
                    {selectedGuestInfo.checkIn
                      ? format(
                          parseISO(selectedGuestInfo.checkIn),
                          "dd/MM/yyyy HH:mm",
                        )
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-out:</span>
                  <span className="font-medium text-slate-700">
                    {selectedGuestInfo.checkOut
                      ? format(
                          parseISO(selectedGuestInfo.checkOut),
                          "dd/MM/yyyy HH:mm",
                        )
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setSelectedGuestInfo(null)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
