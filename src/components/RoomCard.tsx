import { Users, Info } from "lucide-react";
import { Room } from "../types";
import { cn, formatCurrency } from "../lib/utils";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface RoomCardProps {
  key?: string | number;
  room: Room;
  onClick: (room: Room) => void;
}

const statusConfig = {
  available: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Phòng trống",
  },
  occupied: {
    color: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    label: "Đang ở",
  },
  reserved: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    label: "Đã đặt",
  },
  maintenance: {
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    label: "Bảo trì",
  },
};

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const config = statusConfig[room.status];

  return (
    <button
      onClick={() => onClick(room)}
      className={cn(
        "relative flex flex-col text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-1",
        config.color,
        "bg-white", // Override bg to white but keep borders and text from config? Let's just use config full.
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", config.dot)} />
          <span className="font-bold text-lg text-slate-900">
            {room.id}{" "}
            <span className="text-sm font-medium text-slate-500 font-mono ml-1">
              {room.type}
            </span>
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded-md bg-white border",
            config.color.replace("bg-", "maybe-not-used-"),
          )}
        >
          {config.label}
        </span>
      </div>

      <div className="flex-1 mb-2">
        {room.guestName ? (
          <div className="flex items-center gap-2 text-slate-700 mb-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-sm truncate">
              {room.guestName}
            </span>
          </div>
        ) : (
          <div className="text-slate-400 text-sm italic mb-2">
            Chưa có khách
          </div>
        )}

        {room.checkOutTime && room.status !== "maintenance" && (
          <div className="flex flex-col gap-1 mt-3 text-xs text-slate-500 bg-white/60 p-2 rounded-lg border border-slate-100">
            <div className="flex justify-between">
              <span>Đến: </span>
              <span className="font-medium text-slate-700">
                {format(
                  parseISO(room.checkInTime || new Date().toISOString()),
                  "HH:mm - dd/MM",
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Đi: </span>
              <span className="font-medium text-slate-700">
                {format(parseISO(room.checkOutTime), "HH:mm - dd/MM")}
              </span>
            </div>
          </div>
        )}

        {room.reservations && room.reservations.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {room.reservations.length} lịch đặt trước
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-slate-200/50 flex flex-col gap-1 text-xs text-slate-500">
        <div className="flex justify-between items-center">
          <span>T2-T5:</span>
          <span className="font-medium">
            {formatCurrency(room.weekdayPrice)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>T6-CN, Lễ:</span>
          <span className="font-medium text-amber-600">
            {formatCurrency(room.weekendPrice)}
          </span>
        </div>
      </div>
    </button>
  );
}
