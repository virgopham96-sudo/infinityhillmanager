import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock } from "lucide-react";

export default function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium">
      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      <span>{format(time, "HH:mm:ss", { locale: vi })}</span>
      <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">|</span>
      <span className="hidden sm:inline">{format(time, "dd/MM/yyyy")}</span>
    </div>
  );
}
