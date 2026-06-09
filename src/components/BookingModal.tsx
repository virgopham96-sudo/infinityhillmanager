import { useState, useEffect } from "react";
import { Room, BookingRecord, RoomStatus, Reservation } from "../types";
import { cn, formatCurrency, calculateTotalPrice, getLiveRoomState } from "../lib/utils";
import { format, parseISO, addDays, set, startOfDay } from "date-fns";
import toast from "react-hot-toast";
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
  initialCheckInDate?: Date;
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
  initialCheckInDate,
}: BookingModalProps) {
  const defaultCheckIn = set(initialCheckInDate || new Date(), {
    hours: 14,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const defaultCheckOut = addDays(
    set(initialCheckInDate || new Date(), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }),
    1,
  );

  const isFromGrid = !!initialCheckInDate;
  const liveState = isFromGrid ? { status: "available" as RoomStatus } : getLiveRoomState(room);
  const effectiveStatus = liveState.status;

  const [guestName, setGuestName] = useState(isFromGrid ? "" : (liveState.guestName || ""));
  const [deposit, setDeposit] = useState(isFromGrid ? 0 : (room.deposit || 0)); // deposit logic might need refinement if main reservation is hidden, but let's keep it simple
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(
    liveState.checkInTime && !isFromGrid
      ? format(parseISO(liveState.checkInTime), "yyyy-MM-dd'T'HH:mm")
      : format(defaultCheckIn, "yyyy-MM-dd'T'HH:mm"),
  );
  const [checkOut, setCheckOut] = useState(
    liveState.checkOutTime && !isFromGrid
      ? format(parseISO(liveState.checkOutTime), "yyyy-MM-dd'T'HH:mm")
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

  const [minibar, setMinibar] = useState<Record<string, number>>({});
  const [compensation, setCompensation] = useState<number>(0);

  const minibarItems = [
    { id: "mi_coc", name: "Mì cốc Hảo Hảo", price: 20000 },
    { id: "bim_bim", name: "Bim bim", price: 15000 },
    { id: "snack_khoai_tay", name: "Snack khoai tây", price: 50000 },
    { id: "mit_say", name: "Mít sấy", price: 70000 },
    { id: "bo_kho", name: "Bò khô", price: 100000 },
    { id: "nuoc_loc", name: "Nước lọc", price: 10000 },
    { id: "red_bull", name: "Bò húc (Red Bull)", price: 20000 },
    { id: "bia_halong", name: "Bia Hạ Long Bạc", price: 25000 },
    { id: "oreo", name: "Bánh Oreo", price: 20000 },
  ];

  const minibarTotal = minibarItems.reduce(
    (sum, item) => sum + item.price * (minibar[item.id] || 0),
    0,
  );
  const totalSurcharge = minibarTotal + (compensation || 0);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const validatePrimaryDates = () => {
    setError(null);
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (inDate >= outDate) {
      setError("Thời gian Check-in phải trước Check-out.");
      return false;
    }

    if (room.status === "maintenance") {
      toast.error("Phòng đang bảo trì, không thể đặt phòng vào thời điểm này!");
      setError("Phòng đang bảo trì.");
      return false;
    }

    if (isFromGrid && (room.status === "occupied" || room.status === "reserved") && room.checkInTime && room.checkOutTime) {
      const mainIn = new Date(room.checkInTime);
      const mainOut = new Date(room.checkOutTime);
      if (inDate < mainOut && mainIn < outDate) {
        toast.error(`Phòng đã được đặt trước hoặc đang có khách (${room.guestName})!`);
        setError(`Trùng với lịch hiện tại của phòng (${room.guestName}).`);
        return false;
      }
    }

    const overlappingRes = room.reservations?.find((res) => {
      const resIn = new Date(res.checkInTime);
      const resOut = new Date(res.checkOutTime);
      return inDate < resOut && resIn < outDate;
    });

    if (overlappingRes) {
      toast.error(`Phòng đã được đặt trước bởi khách '${overlappingRes.guestName}' trong thời gian này!`);
      setError(`Thời gian này bị trùng với lịch đặt trước của '${overlappingRes.guestName}'.`);
      return false;
    }

    return true;
  };

  const getSafeReservations = () => {
    const isMainFuture = room.status === "reserved" && room.checkInTime && new Date() < parseISO(room.checkInTime);
    const existing = room.reservations || [];
    if (!isMainFuture) return existing;
    
    // Ensure we don't duplicate
    if (existing.some(r => r.checkInTime === room.checkInTime && r.guestName === room.guestName)) {
      return existing;
    }
    
    return [...existing, {
      id: `R${Date.now()}_main`,
      guestName: room.guestName || "Khách",
      deposit: room.deposit || 0,
      checkInTime: room.checkInTime!,
      checkOutTime: room.checkOutTime!
    }];
  };

  const handleReserve = () => {
    if (!guestName) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!validatePrimaryDates()) return;
    
    // If we are making a reservation while the room is available TODAY, we shouldn't wipe out future reservations.
    onUpdateRoom({
      ...room,
      status: "reserved",
      guestName,
      deposit,
      checkInTime: new Date(checkIn).toISOString(),
      checkOutTime: new Date(checkOut).toISOString(),
      reservations: getSafeReservations(),
    });
    onClose();
  };

  const handleCheckIn = () => {
    if (!guestName) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!validatePrimaryDates()) return;

    const checkInDate = startOfDay(new Date(checkIn));
    const today = startOfDay(new Date());
    if (checkInDate > today) {
      setError("Chưa đến ngày nhận phòng. Vui lòng chọn 'Đặt trước'.");
      toast.error("Không thể nhận phòng cho ngày trong tương lai!");
      return;
    }
    
    onUpdateRoom({
      ...room,
      status: "occupied",
      guestName,
      deposit,
      checkInTime: new Date(checkIn).toISOString(),
      checkOutTime: new Date(checkOut).toISOString(),
      reservations: getSafeReservations(),
    });
    onClose();
  };

  const handleUpdate = () => {
    if (!guestName) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }
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
    onUpdateRoom({
      ...room,
      status: "maintenance",
      guestName: "Bảo trì",
      checkInTime: new Date().toISOString(),
      checkOutTime: undefined,
      reservations: getSafeReservations(),
    });
    onClose();
  };

  const handleAvailable = () => {
    onUpdateRoom({
      ...room,
      status: "available",
      guestName: undefined,
      deposit: undefined,
      checkInTime: undefined,
      checkOutTime: undefined,
      reservations: getSafeReservations(),
    });
    onClose();
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

    const actualPaid = Math.max(
      0,
      totalPrice + totalSurcharge - (room.deposit || 0),
    );

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
      reservations: getSafeReservations(),
    });

    onClose();
  };

  const handleAddFutureReservation = () => {
    setError(null);
    if (!futureGuestName) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }

    const inDate = new Date(futureCheckIn);
    const outDate = new Date(futureCheckOut);

    if (inDate >= outDate) {
      setError("Thời gian Check-in phải trước Check-out.");
      return;
    }

    if (room.status === "maintenance") {
      toast.error("Phòng đang bảo trì, không thể thêm lịch đặt trước!");
      setError("Phòng đang được bảo trì.");
      return;
    }

    let overlappingRes = room.reservations?.find((res) => {
      const resIn = new Date(res.checkInTime);
      const resOut = new Date(res.checkOutTime);
      return inDate < resOut && resIn < outDate;
    });

    let overlapWithMain = false;
    if (
      !overlappingRes &&
      (room.status === "occupied" || room.status === "reserved") &&
      room.checkInTime &&
      room.checkOutTime
    ) {
      const mainIn = new Date(room.checkInTime);
      const mainOut = new Date(room.checkOutTime);
      if (inDate < mainOut && mainIn < outDate) {
        overlapWithMain = true;
      }
    }

    if (overlappingRes) {
      toast.error(`Phòng đã được đặt trước bởi khách '${overlappingRes.guestName}' trong thời gian này!`);
      setError(
        `Thời gian này bị trùng với lịch đặt trước khác (khách: '${overlappingRes.guestName}').`,
      );
      return;
    }

    if (overlapWithMain) {
      toast.error(`Phòng đang có khách hoặc đã đặt trước (${room.guestName})!`);
      setError(
        `Thời gian này bị trùng với lịch hiện tại của phòng (khách: '${room.guestName || "Khách vãng lai"}').`,
      );
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
    if (id.endsWith("_main")) {
       onUpdateRoom({
          ...room,
          status: "available",
          guestName: undefined,
          deposit: undefined,
          checkInTime: undefined,
          checkOutTime: undefined
       });
       return;
    }
    onUpdateRoom({
      ...room,
      reservations: (room.reservations || []).filter((r) => r.id !== id),
    });
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
                effectiveStatus === "available"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : effectiveStatus === "occupied"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : effectiveStatus === "reserved"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200",
              )}
            >
              {statusLabels[effectiveStatus]}
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
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4 border border-rose-100 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
                    type="text"
                    value={deposit === 0 ? "" : new Intl.NumberFormat("vi-VN").format(deposit)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setDeposit(raw ? parseInt(raw, 10) : 0);
                    }}
                    placeholder="VD: 500.000"
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
                    <span className="text-sm font-medium text-slate-700">
                      Tổng tiền phòng:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(
                        calculateTotalPrice(
                          checkIn,
                          checkOut,
                          room.weekdayPrice,
                          room.weekendPrice,
                        ),
                      )}
                    </span>
                  </div>
                  {minibarTotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">
                        Minibar & Dịch vụ:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(minibarTotal)}
                      </span>
                    </div>
                  )}
                  {compensation > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">
                        Đền bù:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(compensation)}
                      </span>
                    </div>
                  )}
                  {deposit > 0 && (
                    <div className="flex justify-between items-center text-amber-600">
                      <span className="text-sm font-medium">Đã cọc:</span>
                      <span className="font-semibold">
                        -{formatCurrency(deposit)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                    <span className="text-sm font-medium text-slate-700">
                      Còn lại{" "}
                      {room.status === "occupied"
                        ? "(cần thanh toán)"
                        : "(ước tính)"}
                      :
                    </span>
                    <span className="font-bold text-emerald-700 text-lg">
                      {formatCurrency(
                        Math.max(
                          0,
                          calculateTotalPrice(
                            checkIn,
                            checkOut,
                            room.weekdayPrice,
                            room.weekendPrice,
                          ) +
                            totalSurcharge -
                            deposit,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {room.status === "occupied" && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    Minibar & Dịch vụ thêm
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                      {minibarItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-1.5 p-2.5 bg-white rounded-md border border-slate-200 shadow-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className="text-xs font-semibold text-slate-700 truncate mr-2"
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            <span className="text-xs font-bold text-blue-600 shrink-0">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-0.5">
                            <button
                              className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center font-medium transition-colors cursor-pointer"
                              onClick={() =>
                                setMinibar((prev) => ({
                                  ...prev,
                                  [item.id]: Math.max(
                                    0,
                                    (prev[item.id] || 0) - 1,
                                  ),
                                }))
                              }
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-6 text-center text-slate-800 bg-slate-50 py-1 rounded">
                              {minibar[item.id] || 0}
                            </span>
                            <button
                              className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center font-medium transition-colors cursor-pointer"
                              onClick={() =>
                                setMinibar((prev) => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] || 0) + 1,
                                }))
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Giá trị đền bù (VNĐ)
                      </label>
                      <input
                        type="text"
                        value={compensation === 0 ? "" : new Intl.NumberFormat("vi-VN").format(compensation)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          setCompensation(raw ? parseInt(raw, 10) : 0);
                        }}
                        placeholder="Nhập số tiền đền bù nếu có..."
                        className="w-full border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                        type="text"
                        value={futureDeposit === 0 ? "" : new Intl.NumberFormat("vi-VN").format(futureDeposit)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          setFutureDeposit(raw ? parseInt(raw, 10) : 0);
                        }}
                        placeholder="VD: 500.000"
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

                {getSafeReservations() && getSafeReservations().length > 0 ? (
                  <div className="space-y-2">
                    {getSafeReservations().map((res) => (
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
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hủy đặt phòng này"
                        >
                          <Trash2 className="w-5 h-5" />
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
          {effectiveStatus === "available" && (
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

          {effectiveStatus === "reserved" && (
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

          {effectiveStatus === "occupied" && (
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

          {effectiveStatus === "maintenance" && (
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
