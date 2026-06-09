import { useState, useMemo } from 'react';
import { BookingRecord } from '../types';
import { formatCurrency } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfYear, endOfYear, isWithinInterval, subMonths, subDays, subYears } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, TrendingUp, Users, ArrowRight, Receipt } from 'lucide-react';

interface RevenueReportProps {
  bookings: BookingRecord[];
}

export default function RevenueReport({ bookings }: RevenueReportProps) {
  const [periodType, setPeriodType] = useState<'day' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const completedBookings = useMemo(() => {
    let start, end;
    if (periodType === 'day') {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (periodType === 'month') {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    } else {
      start = startOfYear(selectedDate);
      end = endOfYear(selectedDate);
    }

    return bookings
      .filter(b => b.status === 'completed')
      .filter(b => isWithinInterval(parseISO(b.checkOut), { start, end }))
      .sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());
  }, [bookings, selectedDate, periodType]);

  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalGuests = new Set(completedBookings.map(b => b.guestName)).size;

  const previousPeriodBookings = useMemo(() => {
    let prevDate;
    if (periodType === 'day') {
      prevDate = subDays(selectedDate, 1);
    } else if (periodType === 'month') {
       prevDate = subMonths(selectedDate, 1);
    } else {
       prevDate = subYears(selectedDate, 1);
    }
    
    let start, end;
    if (periodType === 'day') {
      start = startOfDay(prevDate);
      end = endOfDay(prevDate);
    } else if (periodType === 'month') {
      start = startOfMonth(prevDate);
      end = endOfMonth(prevDate);
    } else {
      start = startOfYear(prevDate);
      end = endOfYear(prevDate);
    }

    return bookings
      .filter(b => b.status === 'completed')
      .filter(b => isWithinInterval(parseISO(b.checkOut), { start, end }));
  }, [bookings, selectedDate, periodType]);

  const prevTotalRevenue = previousPeriodBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  
  const growthRate = prevTotalRevenue === 0 
    ? 100 
    : ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;

  const periodLabel = periodType === 'day' ? 'ngày trước' : periodType === 'month' ? 'tháng trước' : 'năm trước';
  const periodCurrentLabel = periodType === 'day' ? 'ngày' : periodType === 'month' ? 'tháng' : 'năm';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 font-sans tracking-tight">Báo cáo doanh thu</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp doanh thu và các giao dịch trong {periodCurrentLabel}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={periodType} 
            onChange={(e) => setPeriodType(e.target.value as 'day' | 'month' | 'year')}
            className="border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
          >
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
          <Calendar className="w-5 h-5 text-slate-400 ml-1 hidden sm:block" />
          {periodType === 'day' && (
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white flex-1"
            />
          )}
          {periodType === 'month' && (
            <input
              type="month"
              value={format(selectedDate, 'yyyy-MM')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white flex-1"
            />
          )}
          {periodType === 'year' && (
            <input
              type="number"
              min="2000"
              max="2100"
              value={selectedDate.getFullYear()}
              onChange={(e) => {
                const val = e.target.value;
                if (val && parseInt(val) >= 2000 && parseInt(val) <= 2100) {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(parseInt(val));
                  setSelectedDate(newDate);
                }
              }}
              className="border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white w-24 flex-1 text-center"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-100 p-3 rounded-xltext-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng doanh thu</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-slate-50">
            <span className={`font-semibold ${growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </span>
            <span className="text-slate-500">so với {periodLabel}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-xltext-blue-600 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Lượt khách đã trả phòng</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{completedBookings.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-slate-50">
            <span className="text-slate-500">Gồm <span className="font-semibold text-slate-700">{totalGuests}</span> khách hàng duy nhất</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Lịch sử giao dịch</h3>
        </div>
        
        {completedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Mã Booking</th>
                  <th className="px-6 py-4">Phòng</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{booking.id}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {booking.roomId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{booking.guestName}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        {format(parseISO(booking.checkIn), 'dd/MM/yyyy', { locale: vi })}
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        {format(parseISO(booking.checkOut), 'dd/MM/yyyy', { locale: vi })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>Không có giao dịch nào được hoàn tất trong {periodCurrentLabel} này.</p>
          </div>
        )}
      </div>
    </div>
  );
}

