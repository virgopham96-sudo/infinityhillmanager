import { LayoutDashboard, Receipt, Settings, Users, Building, Menu, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: 'dashboard' | 'revenue' | 'schedule';
  onChangeView: (view: 'dashboard' | 'revenue' | 'schedule') => void;
}

export default function Sidebar({ currentView, onChangeView }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-screen">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Building className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-lg text-white font-sans tracking-tight">Hotel Manager</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={() => onChangeView('dashboard')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
            currentView === 'dashboard' ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Sơ đồ phòng
        </button>
        <button
          onClick={() => onChangeView('schedule')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
            currentView === 'schedule' ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <CalendarDays className="w-4 h-4" />
          Hiện trạng đặt phòng
        </button>
        <button
          onClick={() => onChangeView('revenue')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
            currentView === 'revenue' ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <Receipt className="w-4 h-4" />
          Báo cáo doanh thu
        </button>
      </nav>
      
      <div className="p-4 pt-6 border-t border-slate-800 mt-auto mb-4">
        <div className="flex items-center gap-3 px-4 py-2 opacity-60">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Cài đặt</span>
        </div>
      </div>
    </aside>
  );
}
