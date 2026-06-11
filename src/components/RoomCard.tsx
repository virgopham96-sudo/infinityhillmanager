import { Users, Info } from "lucide-react";
import { Room } from "../types";
import { cn, formatCurrency, getLiveRoomState } from "../lib/utils";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface RoomCardProps {
  key?: string | number;
  room: Room;
  onClick: (room: Room) => void;
}

const statusConfig = {
  available: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
    label: "Phòng trống",
  },
  occupied: {
    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50",
    dot: "bg-rose-500",
    label: "Đang ở",
  },
  reserved: {
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    dot: "bg-amber-500",
    label: "Đã đặt",
  },
  maintenance: {
    color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-500",
    label: "Bảo trì",
  },
};

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const liveState = getLiveRoomState(room);
  const config = statusConfig[liveState.status];

  // We should count total future reservations for display
  const totalReservations = (room.reservations?.length || 0) + (room.status === "reserved" && room.checkInTime && new Date() < parseISO(room.checkInTime) ? 1 : 0);

  return (
    <button
      onClick={() => onClick(room)}
      className={cn(
        "relative flex flex-col text-left p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-1",
        config.color
      )}
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4 w-full">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={cn(
              "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0",
              config.dot,
            )}
          />
          <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-none">
            {room.id}
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 font-mono ml-1">
              {room.type}
            </span>
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-white dark:bg-slate-900 border truncate max-w-[80px] sm:max-w-none text-center",
            config.color.split(" ")[2], // border color
            "dark:border-opacity-50"
          )}
        >
          {config.label}
        </span>
      </div>

      <div className="flex-1 mb-2 w-full">
        {liveState.guestName ? (
          <div className="flex items-center gap-1 sm:gap-2 text-slate-700 dark:text-slate-300 mb-2">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="font-medium text-xs sm:text-sm truncate">
              {liveState.guestName}
            </span>
          </div>
        ) : (
          <div className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm italic mb-2">
            Chưa có khách
          </div>
        )}

        {liveState.checkOutTime && liveState.status !== "maintenance" && (
          <div className="flex flex-col gap-0.5 sm:gap-1 mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/50 p-1.5 sm:p-2 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center gap-1">
              <span className="shrink-0">Đến:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {format(
                  parseISO(liveState.checkInTime || new Date().toISOString()),
                  "HH:mm-dd/MM",
                )}
              </span>
            </div>
            <div className="flex justify-between items-center gap-1">
              <span className="shrink-0">Đi:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {format(parseISO(liveState.checkOutTime), "HH:mm-dd/MM")}
              </span>
            </div>
          </div>
        )}

        {totalReservations > 0 && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1.5 sm:px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            <span className="truncate">{String(totalReservations).padStart(2, '0')} đã đặt</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-200/50 dark:border-slate-700 flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 w-full">
        <div className="flex justify-between items-center gap-1">
          <span className="truncate">T2-T5:</span>
          <span className="font-medium shrink-0">
            {formatCurrency(room.weekdayPrice)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-1">
          <span className="truncate">T6-CN,Lễ:</span>
          <span className="font-medium text-amber-600 dark:text-amber-500 shrink-0">
            {formatCurrency(room.weekendPrice)}
          </span>
        </div>
      </div>
    </button>
  );
}
