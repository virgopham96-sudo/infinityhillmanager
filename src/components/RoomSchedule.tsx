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
  startOfWeek,
  endOfWeek,
  isSameMonth
} from "date-fns";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "../lib/utils";

interface RoomScheduleProps {
  rooms: Room[];
  onBookRoom?: (roomId: string, date: Date) => void;
  onEditGuest?: (guestName: string) => void;
}

export default function RoomSchedule({ rooms, onBookRoom, onEditGuest }: RoomScheduleProps) {
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const [selectedMobileDate, setSelectedMobileDate] = useState(startOfDay(new Date()));
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

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
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
        return "bg-emerald-500 dark:bg-emerald-600";
      case "occupied":
        return "bg-rose-500 dark:bg-rose-600";
      case "reserved":
        return "bg-amber-400 dark:bg-amber-500";
      case "maintenance":
        return "bg-slate-900 dark:bg-slate-500";
      default:
        return "bg-slate-200 dark:bg-slate-700";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full">
      {/* Header Month Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight min-w-[150px] text-center uppercase">
            THÁNG {format(currentDate, "M")}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300 w-full md:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600"></span> Trống
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-rose-500 dark:bg-rose-600"></span> Đang sử dụng
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-amber-400 dark:bg-amber-500"></span> Đã đặt trước
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-slate-900 dark:bg-slate-500"></span> Bảo trì
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-1 overflow-auto relative">
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm">
            <tr>
              <th className="sticky left-0 bg-slate-50 dark:bg-slate-900 p-2 md:p-3 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 w-16 md:w-24 z-20 shadow-sm">
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
                    className="p-1 md:p-2 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 text-center min-w-[28px] md:min-w-[36px] relative group cursor-help"
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rooms
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60">
                  <td className="sticky left-0 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 p-2 md:p-3 text-xs md:text-sm border-r border-slate-200 dark:border-slate-800 z-10">
                    {room.id}
                  </td>
                  {daysInMonth.map((day) => {
                    const cellData = getCellData(room, day);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <td
                        key={day.toISOString()}
                        className={cn(
                          "border-r border-slate-200 dark:border-slate-800 p-0.5 md:p-1 cursor-pointer transition-colors relative group",
                          isToday && "bg-blue-50/30 dark:bg-blue-900/10",
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

      {/* Mobile View */}
      <div className="flex md:hidden flex-col flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 gap-y-2 p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">{d}</div>
          ))}
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedMobileDate);
            
            // Collect statuses for this day to show dots
            const activeStatuses = new Set<string>();
            rooms.forEach(r => {
              const st = getCellData(r, day).status;
              if (st !== "available" && st !== "maintenance") {
                activeStatuses.add(st);
              }
            });

            return (
              <div 
                key={day.toISOString()} 
                onClick={() => setSelectedMobileDate(startOfDay(day))}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors",
                  !isCurrentMonth ? "text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-300",
                  isToday && !isSelected && "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold",
                  isSelected && "bg-blue-600 text-white shadow-md font-bold"
                )}>
                  {format(day, "d")}
                </div>
                <div className="flex gap-0.5 h-1">
                  {Array.from(activeStatuses).map(st => (
                    <span key={st} className={cn("w-1 h-1 rounded-full", getStatusColor(st))}></span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 flex-1">
          {(() => {
            const counts = { available: 0, occupied: 0, reserved: 0, maintenance: 0 };
            rooms.forEach(r => {
              const st = getCellData(r, selectedMobileDate).status;
              counts[st as keyof typeof counts] = (counts[st as keyof typeof counts] || 0) + 1;
            });

            return (
              <div className="flex flex-col gap-2 mb-4">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>Hoạt động ngày {format(selectedMobileDate, "dd/MM/yyyy")}</span>
                  {isSameDay(selectedMobileDate, new Date()) && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] rounded-full uppercase tracking-widest font-bold">Hôm nay</span>
                  )}
                </h3>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  <div className="flex items-center gap-1.5 shrink-0" title="Trống">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor("available"))}></span> Trống: {counts.available}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" title="Đang sử dụng">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor("occupied"))}></span> Đang sử dụng: {counts.occupied}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" title="Đã đặt trước">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor("reserved"))}></span> Đã đặt trước: {counts.reserved}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" title="Bảo trì">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor("maintenance"))}></span> Bảo trì: {counts.maintenance}
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="space-y-3">
            {(() => {
              const orderedRooms = rooms.map(room => {
                const cellData = getCellData(room, selectedMobileDate);
                return { room, cellData };
              }).sort((a, b) => {
                const order: Record<string, number> = { "occupied": 1, "reserved": 2, "maintenance": 3, "available": 4 };
                return order[a.cellData.status] - order[b.cellData.status];
              });

              if (orderedRooms.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                    Không có hoạt động nào trong ngày này.
                  </div>
                );
              }

              return orderedRooms.map(({ room, cellData }) => {
                if (cellData.status === "available" || cellData.status === "maintenance") {
                  return (
                    <div 
                      key={room.id}
                      onClick={() => {
                        if (cellData.status === "available" && onBookRoom) onBookRoom(room.id, selectedMobileDate);
                      }}
                      className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-transparent flex items-center justify-between shadow-sm cursor-pointer hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("w-3 h-3 rounded-full", getStatusColor(cellData.status))}></span>
                        <span className="font-medium text-slate-600 dark:text-slate-300 text-sm">Phòng {room.id}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        {cellData.status === "available" ? "Trống cả ngày" : "Đang bảo trì"}
                      </span>
                    </div>
                  );
                }

                return (
                  <div 
                    key={room.id}
                    onClick={() => {
                      setSelectedGuestInfo({
                        room: room.id,
                        date: selectedMobileDate,
                        guestName: cellData.guestName,
                        status: cellData.status,
                        checkIn: cellData.checkIn,
                        checkOut: cellData.checkOut,
                      });
                    }}
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex items-stretch gap-3 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden"
                  >
                    <div className={cn("w-1.5 flex-shrink-0 self-stretch rounded-full", getStatusColor(cellData.status))}></div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Phòng {room.id}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                          {cellData.status === "occupied" ? "Đang ở" : "Đã đặt trước"}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate mb-2">
                        👤 {cellData.guestName || "Khách lẻ"}
                      </div>
                      {(cellData.checkIn || cellData.checkOut) && (
                        <div className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                          {cellData.checkIn && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-500">📥</span> Nhận: {format(parseISO(cellData.checkIn), "HH:mm, dd/MM")}
                            </div>
                          )}
                          {cellData.checkOut && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-rose-500">📤</span> Trả: {format(parseISO(cellData.checkOut), "HH:mm, dd/MM")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Guest Info Modal/Popup */}
      {selectedGuestInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelectedGuestInfo(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-transparent dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                Chi tiết phòng {selectedGuestInfo.room}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Khách hàng
                  </p>
                  <p 
                    className={cn(
                      "text-sm font-semibold text-slate-800 dark:text-slate-100",
                      onEditGuest && selectedGuestInfo.guestName && selectedGuestInfo.guestName !== "Khách lẻ"
                        ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                        : ""
                    )}
                    onClick={() => {
                      if (onEditGuest && selectedGuestInfo.guestName && selectedGuestInfo.guestName !== "Khách lẻ") {
                        onEditGuest(selectedGuestInfo.guestName);
                        setSelectedGuestInfo(null);
                      }
                    }}
                  >
                    {selectedGuestInfo.guestName || "Không rõ"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Check-in:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {selectedGuestInfo.checkIn
                      ? format(
                          parseISO(selectedGuestInfo.checkIn),
                          "dd/MM/yyyy HH:mm",
                        )
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Check-out:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
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
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setSelectedGuestInfo(null)}
                className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
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
