import { useState, useEffect } from "react";
import { Room, BookingRecord, RoomStatus, Reservation } from "../types";
import { cn, formatCurrency, calculateTotalPrice } from "../lib/utils";
import { format, parseISO, addDays, set } from "date-fns";
import {
  X,
  Clock,
  User,
  CreditCard,
  ShieldAlert,
  CalendarPlus,
  Trash2,
} from "lucide-react";

interface BookingModalProps {
  room: Room;
  onClose: () => void;
  onUpdateRoom: (room: Room) => void;
  onAddBooking: (booking: BookingRecord) => void;
}

const statusLabels: Record<RoomStatus, string> = {
  available: "Phòng trống",
  occupied: "Đang ở",
  reserved: "Đã đặt",
  maintenance: "Bảo trì",
};

export default function BookingModal({
  room,
  onClose,
  onUpdateRoom,
  onAddBooking,
}: BookingModalProps) {
  const defaultCheckIn = set(new Date(), {
    hours: 14,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const defaultCheckOut = addDays(
    set(new Date(), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }),
    1,
  );

  const [guestName, setGuestName] = useState(room.guestName || "");
  const [deposit, setDeposit] = useState(room.deposit || 0);
  const [checkIn, setCheckIn] = useState(
    room.checkInTime
      ? format(parseISO(room.checkInTime), "yyyy-MM-dd'T'HH:mm")
      : format(defaultCheckIn, "yyyy-MM-dd'T'HH:mm"),
  );
  const [checkOut, setCheckOut] = useState(
    room.checkOutTime
      ? format(parseISO(room.checkOutTime), "yyyy-MM-dd'T'HH:mm")
      : format(defaultCheckOut, "yyyy-MM-dd'T'HH:mm"),
  );

  const [showAddFuture, setShowAddFuture] = useState(false);
  const [futureGuestName, setFutureGuestName] = useState("");
  const [futureDeposit, setFutureDeposit] = useState(0);
  const [futureCheckIn, setFutureCheckIn] = useState(
    format(defaultCheckIn, "yyyy-MM-dd'T'HH:mm"),
  );
  const [futureCheckOut, setFutureCheckOut] = useState(
    format(defaultCheckOut, "yyyy-MM-dd'T'HH:mm"),
  );

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const validatePrimaryDates = () => {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (inDate >= outDate) {
      alert("Thời gian Check-in phải trước Check-out.");
      return false;
    }

    const isOverlap = room.reservations?.some((res) => {
      const resIn = new Date(res.checkInTime);
      const resOut = new Date(res.checkOutTime);
      return inDate < resOut && resIn < outDate;
    });

    if (isOverlap) {
      alert("Thời gian này bị trùng với một lịch đặt trước đã có.");
      return false;
    }

    return true;
  };

  const handleReserve = () => {
    if (!guestName) return alert("Vui lòng nhập tên khách hàng");
    if (!validatePrimaryDates()) return;
    onUpdateRoom({
      ...room,
      status: "reserved",
      guestName,
      deposit,
      checkInTime: new Date(checkIn).toISOString(),
      checkOutTime: new Date(checkOut).toISOString(),
    });
    onClose();
  };

  const handleCheckIn = () => {
    if (!guestName) return alert("Vui lòng nhập tên khách hàng");
    if (!validatePrimaryDates()) return;
    onUpdateRoom({
      ...room,
      status: "occupied",
      guestName,
      deposit,
      checkInTime: new Date(checkIn).toISOString(),
      checkOutTime: new Date(checkOut).toISOString(),
    });
    onClose();
  };

  const handleUpdate = () => {
    if (!guestName) return alert("Vui lòng nhập tên khách hàng");
    if (!validatePrimaryDates()) return;
    onUpdateRoom({
      ...room,
      guestName,
      deposit,
      checkInTime: new Date(checkIn).toISOString(),
      checkOutTime: new Date(checkOut).toISOString(),
    });
    onClose();
  };

  const handleMaintenance = () => {
    if (
      confirm(
        "Xác nhận chuyển phòng sang trạng thái bảo trì? Các thông tin đặt phòng hiện tại sẽ bị xóa.",
      )
    ) {
      onUpdateRoom({
        ...room,
        status: "maintenance",
        guestName: undefined,
        checkInTime: undefined,
        checkOutTime: undefined,
      });
      onClose();
    }
  };

  const handleAvailable = () => {
    if (confirm("Xác nhận hủy và chuyển phòng về trạng thái trống?")) {
      onUpdateRoom({
        ...room,
        status: "available",
        guestName: undefined,
        deposit: undefined,
        checkInTime: undefined,
        checkOutTime: undefined,
      });
      onClose();
    }
  };

  const handleCheckOut = () => {
    const start = parseISO(room.checkInTime || checkIn);
    const end = new Date();

    const totalPrice = calculateTotalPrice(
      start,
      end,
      room.weekdayPrice,
      room.weekendPrice,
    );

    const actualPaid = Math.max(0, totalPrice - (room.deposit || 0));

    const newBooking: BookingRecord = {
      id: `B${Date.now()}`,
      roomId: room.id,
      guestName: guestName || room.guestName || "Khách",
      checkIn: room.checkInTime || new Date(checkIn).toISOString(),
      checkOut: end.toISOString(),
      totalPrice: actualPaid,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    onAddBooking(newBooking);

    // After checkout, check if there are future reservations today
    // For simplicity, just make it available
    onUpdateRoom({
      ...room,
      status: "available",
      guestName: undefined,
      deposit: undefined,
      checkInTime: undefined,
      checkOutTime: undefined,
    });

    onClose();
  };

  const handleAddFutureReservation = () => {
    if (!futureGuestName) return alert("Vui lòng nhập tên khách hàng");

    const inDate = new Date(futureCheckIn);
    const outDate = new Date(futureCheckOut);

    if (inDate >= outDate) {
      alert("Thời gian Check-in phải trước Check-out.");
      return;
    }

    let isOverlap = room.reservations?.some((res) => {
      const resIn = new Date(res.checkInTime);
      const resOut = new Date(res.checkOutTime);
      return inDate < resOut && resIn < outDate;
    });

    if (!isOverlap && (room.status === "occupied" || room.status === "reserved")) {
      const mainIn = new Date(checkIn);
      const mainOut = new Date(checkOut);
      if (inDate < mainOut && mainIn < outDate) {
        isOverlap = true;
      }
    }

    if (isOverlap) {
      alert("Thời gian này bị trùng với lịch hiện tại hoặc lịch đặt trước khác.");
      return;
    }

    const newReservation: Reservation = {
      id: `R${Date.now()}`,
      guestName: futureGuestName,
      deposit: futureDeposit,
      checkInTime: new Date(futureCheckIn).toISOString(),
      checkOutTime: new Date(futureCheckOut).toISOString(),
    };

    const updatedReservations = [...(room.reservations || []), newReservation];

    onUpdateRoom({
      ...room,
      reservations: updatedReservations,
    });

    setShowAddFuture(false);
    setFutureGuestName("");
  };

  const handleRemoveReservation = (id: string) => {
    if (confirm("Xác nhận hủy lịch đặt trước này?")) {
      onUpdateRoom({
        ...room,
        reservations: (room.reservations || []).filter((r) => r.id !== id),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-800">
              Phòng {room.id}
            </h2>
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium border",
                room.status === "available"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : room.status === "occupied"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : room.status === "reserved"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200",
              )}
            >
              {statusLabels[room.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {room.status === "maintenance" ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <ShieldAlert className="w-16 h-16 text-slate-300 mb-4" />
              <p className="font-medium text-lg text-slate-700">
                Phòng đang bảo trì sửa chữa
              </p>
              <p className="text-sm mt-1 text-center">
                Không thể đón khách vào lúc này. Vui lòng cập nhật trạng thái
                khi hoàn tất sửa chữa.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Tên khách hàng
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nhập tên người đặt / khách ở"
                  className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none border bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Từ ngày (Check-in)
                  </label>
                  <input
                    type="datetime-local"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Đến ngày (Check-out)
                  </label>
                  <input
                    type="datetime-local"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    Đã đặt cọc (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    min="0"
                    step="10000"
                    placeholder="VD: 500000"
                    className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none border bg-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Đơn giá:
                  </span>
                  <div className="text-right">
                    <div className="font-bold text-blue-700">
                      {formatCurrency(room.weekdayPrice)}{" "}
                      <span className="text-xs font-normal">/ đêm (T2-T5)</span>
                    </div>
                    <div className="font-bold text-amber-600 mt-1">
                      {formatCurrency(room.weekendPrice)}{" "}
                      <span className="text-xs font-normal">
                        / đêm (T6-CN, Lễ)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-blue-200/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Tổng tiền dự kiến:</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(
                        calculateTotalPrice(checkIn, checkOut, room.weekdayPrice, room.weekendPrice)
                      )}
                    </span>
                  </div>
                  {deposit > 0 && (
                    <div className="flex justify-between items-center text-amber-600">
                      <span className="text-sm font-medium">Đã cọc:</span>
                      <span className="font-semibold">-{formatCurrency(deposit)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                    <span className="text-sm font-medium text-slate-700">Còn lại (ước tính):</span>
                    <span className="font-bold text-emerald-700 text-lg">
                      {formatCurrency(
                        Math.max(0, calculateTotalPrice(checkIn, checkOut, room.weekdayPrice, room.weekendPrice) - deposit)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Future Reservations Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <CalendarPlus className="w-4 h-4 text-slate-400" />
                    Lịch đặt trước ({room.reservations?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowAddFuture(!showAddFuture)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {showAddFuture ? "Hủy thêm" : "+ Thêm lịch"}
                  </button>
                </div>

                {showAddFuture && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tên khách hàng
                      </label>
                      <input
                        type="text"
                        value={futureGuestName}
                        onChange={(e) => setFutureGuestName(e.target.value)}
                        placeholder="Nhập tên người đặt"
                        className="w-full border-slate-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none border bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Check-in
                        </label>
                        <input
                          type="datetime-local"
                          value={futureCheckIn}
                          onChange={(e) => setFutureCheckIn(e.target.value)}
                          className="w-full border-slate-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none border bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Check-out
                        </label>
                        <input
                          type="datetime-local"
                          value={futureCheckOut}
                          onChange={(e) => setFutureCheckOut(e.target.value)}
                          className="w-full border-slate-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none border bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tiền cọc (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={futureDeposit}
                        onChange={(e) => setFutureDeposit(Number(e.target.value))}
                        min="0"
                        step="10000"
                        className="w-full border-slate-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none border bg-white"
                      />
                    </div>
                    <button
                      onClick={handleAddFutureReservation}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      Lưu lịch đặt trước
                    </button>
                  </div>
                )}

                {room.reservations && room.reservations.length > 0 ? (
                  <div className="space-y-2">
                    {room.reservations.map((res) => (
                      <div
                        key={res.id}
                        className="p-3 border border-slate-200 rounded-lg flex items-center justify-between bg-white group"
                      >
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="text-sm font-medium text-slate-800">
                              {res.guestName}
                            </p>
                            {res.deposit ? (
                              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                Cọc: {formatCurrency(res.deposit)}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(
                              parseISO(res.checkInTime),
                              "dd/MM/yyyy HH:mm",
                            )}{" "}
                            -{" "}
                            {format(
                              parseISO(res.checkOutTime),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveReservation(res.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors sm:opacity-0 group-hover:opacity-100"
                          title="Hủy đặt phòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !showAddFuture && (
                    <div className="text-center py-4 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                      Chưa có lịch đặt trước
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 flex-wrap justify-end items-center">
          {room.status === "available" && (
            <>
              <button
                onClick={handleMaintenance}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-200/50 text-sm font-medium rounded-lg transition-colors mr-auto"
              >
                Báo bảo trì
              </button>
              <button
                onClick={handleReserve}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Lưu đặt trước
              </button>
              <button
                onClick={handleCheckIn}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Nhận phòng
              </button>
            </>
          )}

          {room.status === "reserved" && (
            <>
              <button
                onClick={handleAvailable}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors mr-auto"
              >
                Hủy đặt
              </button>
              <button
                onClick={handleUpdate}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Lưu thông tin
              </button>
              <button
                onClick={handleCheckIn}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Khách đến nhận phòng
              </button>
            </>
          )}

          {room.status === "occupied" && (
            <>
              <button
                onClick={handleUpdate}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors mr-auto"
              >
                Lưu thông tin
              </button>
              <button
                onClick={handleCheckOut}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Thanh toán & Trả phòng
              </button>
            </>
          )}

          {room.status === "maintenance" && (
            <button
              onClick={handleAvailable}
              className="px-5 py-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Đã sửa xong (Trống)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
