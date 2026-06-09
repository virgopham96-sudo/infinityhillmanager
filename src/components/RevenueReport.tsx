import { useState, useMemo } from "react";
import { BookingRecord } from "../types";
import { formatCurrency } from "../lib/utils";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  isWithinInterval,
  subMonths,
  subDays,
  subYears,
} from "date-fns";
import { vi } from "date-fns/locale";
import * as xlsx from "xlsx";
import {
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  Receipt,
  Trash2,
  Download,
} from "lucide-react";

interface RevenueReportProps {
  bookings: BookingRecord[];
  onRemoveBooking?: (id: string) => void;
}

export default function RevenueReport({
  bookings,
  onRemoveBooking,
}: RevenueReportProps) {
  const [periodType, setPeriodType] = useState<"day" | "month" | "year">(
    "month",
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const completedBookings = useMemo(() => {
    let start, end;
    if (periodType === "day") {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (periodType === "month") {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    } else {
      start = startOfYear(selectedDate);
      end = endOfYear(selectedDate);
    }

    return bookings
      .filter((b) => b.status === "completed")
      .filter((b) => isWithinInterval(parseISO(b.checkOut), { start, end }))
      .sort(
        (a, b) =>
          new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime(),
      );
  }, [bookings, selectedDate, periodType]);

  const totalRevenue = completedBookings.reduce(
    (sum, b) => sum + b.totalPrice,
    0,
  );
  const totalGuests = new Set(completedBookings.map((b) => b.guestName)).size;

  const previousPeriodBookings = useMemo(() => {
    let prevDate;
    if (periodType === "day") {
      prevDate = subDays(selectedDate, 1);
    } else if (periodType === "month") {
      prevDate = subMonths(selectedDate, 1);
    } else {
      prevDate = subYears(selectedDate, 1);
    }

    let start, end;
    if (periodType === "day") {
      start = startOfDay(prevDate);
      end = endOfDay(prevDate);
    } else if (periodType === "month") {
      start = startOfMonth(prevDate);
      end = endOfMonth(prevDate);
    } else {
      start = startOfYear(prevDate);
      end = endOfYear(prevDate);
    }

    return bookings
      .filter((b) => b.status === "completed")
      .filter((b) => isWithinInterval(parseISO(b.checkOut), { start, end }));
  }, [bookings, selectedDate, periodType]);

  const prevTotalRevenue = previousPeriodBookings.reduce(
    (sum, b) => sum + b.totalPrice,
    0,
  );

  const growthRate =
    prevTotalRevenue === 0
      ? 100
      : ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;

  const periodLabel =
    periodType === "day"
      ? "ngày trước"
      : periodType === "month"
        ? "tháng trước"
        : "năm trước";
  const periodCurrentLabel =
    periodType === "day" ? "ngày" : periodType === "month" ? "tháng" : "năm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 font-sans tracking-tight">
            Báo cáo doanh thu
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp doanh thu và các giao dịch trong {periodCurrentLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={periodType}
            onChange={(e) =>
              setPeriodType(e.target.value as "day" | "month" | "year")
            }
            className="border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
          >
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
          <Calendar className="w-5 h-5 text-slate-400 ml-1 hidden sm:block" />
          {periodType === "day" && (
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white flex-1"
            />
          )}
          {periodType === "month" && (
            <input
              type="month"
              value={format(selectedDate, "yyyy-MM")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white flex-1"
            />
          )}
          {periodType === "year" && (
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
              <p className="text-sm font-medium text-slate-500">
                Tổng doanh thu
              </p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-slate-50">
            <span
              className={`font-semibold ${growthRate >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
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
              <p className="text-sm font-medium text-slate-500">
                Lượt khách đã trả phòng
              </p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {completedBookings.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-slate-50">
            <span className="text-slate-500">
              Gồm{" "}
              <span className="font-semibold text-slate-700">
                {totalGuests}
              </span>{" "}
              khách hàng duy nhất
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Lịch sử giao dịch</h3>
          <button
            onClick={() => {
              const exportData = completedBookings.map((b) => ({
                Phòng: b.roomId,
                "Khách hàng": b.guestName,
                "Thời gian nhận phòng": format(parseISO(b.checkIn), "dd/MM/yyyy HH:mm"),
                "Thời gian trả phòng": format(parseISO(b.checkOut), "dd/MM/yyyy HH:mm"),
                "Doanh thu (VNĐ)": b.totalPrice,
              }));
              const worksheet = xlsx.utils.json_to_sheet(exportData);
              const workbook = xlsx.utils.book_new();
              xlsx.utils.book_append_sheet(workbook, worksheet, "DoanhThu");
              xlsx.writeFile(workbook, `Doanh_Thu_${format(new Date(), "yyyy_MM_dd")}.xlsx`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>

        {completedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Phòng</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Doanh thu</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {booking.roomId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {booking.guestName}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        {format(parseISO(booking.checkIn), "dd/MM/yyyy", {
                          locale: vi,
                        })}
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        {format(parseISO(booking.checkOut), "dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end">
                      <button
                        onClick={() => {
                          setDeleteBookingId(booking.id);
                          setDeletePassword("");
                          setDeleteError("");
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa lịch sử"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>
              Không có giao dịch nào được hoàn tất trong {periodCurrentLabel}{" "}
              này.
            </p>
          </div>
        )}
      </div>

      {deleteBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Xác nhận xóa
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Vui lòng nhập mật khẩu để xóa lịch sử giao dịch này.
            </p>
            {deleteError && (
              <p className="text-sm text-rose-600 mb-3 font-medium bg-rose-50 p-2 rounded-md border border-rose-100">
                {deleteError}
              </p>
            )}
            <input
              type="password"
              className="w-full border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none border bg-white mb-4"
              placeholder="Nhập mật khẩu..."
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (deletePassword === "12345678@") {
                    onRemoveBooking?.(deleteBookingId);
                    setDeleteBookingId(null);
                  } else {
                    setDeleteError("Mật khẩu không chính xác!");
                  }
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteBookingId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (deletePassword === "12345678@") {
                    onRemoveBooking?.(deleteBookingId);
                    setDeleteBookingId(null);
                  } else {
                    setDeleteError("Mật khẩu không chính xác!");
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
