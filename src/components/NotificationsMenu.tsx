import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { Room } from "../types";
import { getLiveRoomState, cn } from "../lib/utils";
import { format, parseISO } from "date-fns";

interface NotificationsMenuProps {
  rooms: Room[];
}

export default function NotificationsMenu({ rooms }: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = rooms.map((room) => {
    const liveState = getLiveRoomState(room);
    if (liveState.status === "occupied" && liveState.checkOutTime) {
      try {
        const outDate = parseISO(liveState.checkOutTime);
        const outDateStr = format(outDate, "yyyy-MM-dd");
        const todayStr = format(new Date(), "yyyy-MM-dd");
        
        if (todayStr === outDateStr) {
          const timeStr = format(outDate, "HH:mm");
          const guestName = liveState.guestName || "Khách lẻ";
          return {
            roomId: room.id,
            timeStr,
            guestName,
            isCheckoutToday: true,
          };
        }
      } catch (e) {
        console.error("Error parsing checkout time for alert:", e);
      }
    }
    return null;
  }).filter(Boolean) as { roomId: string, timeStr: string, guestName: string, isCheckoutToday: boolean }[];

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <Bell className="w-5 h-5 md:w-5 md:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 border-none animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
          <div className="sticky top-0 bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Thông báo</h3>
          </div>
          <div className="p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Không có thông báo nào
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div key={index} className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                    <div>
                      <p className="font-medium text-rose-600 dark:text-rose-400 text-sm mb-0.5">Sắp đến giờ trả phòng hôm nay</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Phòng <strong className="text-blue-600 dark:text-blue-400">{notif.roomId}</strong> ({notif.guestName}) dự kiến checkout lúc <strong>{notif.timeStr}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
