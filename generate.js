const fs = require('fs');

const code = `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGO_URL = "https://lh3.googleusercontent.com/pw/AP1GczMk0hS3jdTwzJkHeGWSWRjqaUS5YYGFB5KbMDMeFlBdpving26XUlJjNeBV5Hgu1LMFBhJva188u3oI3ki789nXcjxoVTfjk5LDpRs7y0gszs7daOP8=s512";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Calculator State
  const [calcRoom, setCalcRoom] = useState('room1');
  const [calcWeekdays, setCalcWeekdays] = useState(1);
  const [calcWeekends, setCalcWeekends] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Ticket Calculator State
  const [ticketAdults, setTicketAdults] = useState(2);
  const [ticketKids, setTicketKids] = useState(0);
  const [tripType, setTripType] = useState(2);

  const galleryItems = [
    { src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200", caption: "Toàn cảnh kiến trúc cổ điển lộng lẫy hắt sáng tuyệt đẹp về đêm tại Infinity Hill Hotel." },
    { src: "https://images.unsplash.com/photo-1533587845331-5768296a2b8e?auto=format&fit=crop&q=80&w=1200", caption: "Khu vực Glamping Cafe sườn đồi thơ mộng lấp lánh rực rỡ ánh đèn lồng hoàng hôn." },
    { src: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1200", caption: "Vườn hoa đá sỏi cùng lối tản bộ nội khu mát mắt rợp bóng dừa xanh rì." },
    { src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200", caption: "Thiết kế phòng ngủ với chất liệu gỗ mộc ấm cúng, chuẩn phong cách châu Âu tân cổ điển." },
    { src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=1200", caption: "Phòng tắm hiện đại và tinh tế mang họa tiết gạch hoa vintage cổ điển sạch sẽ và sang trọng." }
  ];

  const roomsData = {
    room1: { name: "Phòng 1G (King Size)", weekday: 1200000, weekend: 1400000 },
    room2: { name: "Phòng 2G (Twin Room)", weekday: 1400000, weekend: 1600000 },
    room3: { name: "Phòng 3G (Triple Room)", weekday: 1600000, weekend: 1800000 },
    room4: { name: "Phòng 1,2G VIP", weekday: 1700000, weekend: 1900000 }
  };

  const getCalcTotal = () => {
    const r = roomsData[calcRoom as keyof typeof roomsData];
    return (calcWeekdays * r.weekday) + (calcWeekends * r.weekend);
  };

  const submitBookingRequest = () => {
    if (!clientName || !clientPhone) {
      alert("Vui lòng điền đầy đủ Họ tên và SĐT để nhận duyệt booking!");
      return;
    }
    const r = roomsData[calcRoom as keyof typeof roomsData];
    const textMessage = encodeURIComponent(\`Chào Mr. Đạt, tôi tên là \${clientName} (SĐT: \${clientPhone}). Tôi vừa gửi yêu cầu đặt \${r.name} với thời gian \${calcWeekdays} đêm thường, \${calcWeekends} đêm cuối tuần. Tổng tạm tính: \${getCalcTotal().toLocaleString('vi-VN')} đ.\`);
    window.open(\`https://zalo.me/0383696666?text=\${textMessage}\`, '_blank');
  };

  const getTicketTotalBoat = () => ((ticketAdults * 250000) + (ticketKids * 200000)) * tripType;
  const getTicketTotalPort = () => ((ticketAdults * 50000) + (ticketKids * 20000)) * tripType;

  return (
    <div className="font-sans bg-slate-50 text-slate-800 selection:bg-[#D4AF37] selection:text-[#0B2240] overflow-x-hidden min-h-screen">
      
      {/* TOP BAR */}
      <div className="bg-[#0B2240] text-white text-xs py-2.5 px-4 border-b border-[#D4AF37]/20 sticky top-0 z-50 transition-all duration-300 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-4 flex-wrap justify-center">
                <span className="whitespace-nowrap"><i className="fa-solid fa-phone text-[#D4AF37] mr-1.5 animate-pulse"></i> Hotline 24/7: <a href="tel:0383696666" className="font-bold hover:text-[#D4AF37] transition-colors">0383.696.666</a> (<span>Mr. Đạt</span>)</span>
                <span className="hidden md:inline text-white/30">|</span>
                <a href="https://maps.app.goo.gl/MXZdbN9LWCFTfqeA8" target="_blank" rel="noreferrer" className="hover:text-[#D4AF37] transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap">
                    <i className="fa-solid fa-location-dot text-[#D4AF37]"></i> Đảo Quan Lạn, Vân Đồn, Quảng Ninh
                </a>
            </div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-[#D4AF37]">
                <span className="font-semibold flex items-center gap-1 whitespace-nowrap"><i className="fa-solid fa-star"></i> Miễn phí buffet ăn sáng & xe điện trung chuyển</span>
            </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="bg-white/95 backdrop-blur-md shadow-md sticky top-10 z-40 transition-all duration-300 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center gap-4">
                <a href="#" className="flex items-center gap-3 group py-1.5 shrink-0" title="Infinity Hill">
                    <div className="relative h-14 flex items-center justify-start">
                        <img src={LOGO_URL} alt="Infinity Hill" className="h-10 xl:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                    </div>
                </a>

                <div className="hidden lg:flex items-center gap-4 xl:gap-6 font-bold text-[#0B2240] text-xs xl:text-sm uppercase tracking-wider">
                    <a href="#about" className="hover:text-[#D4AF37] transition-all duration-200 whitespace-nowrap py-2">Giới Thiệu</a>
                    <a href="#rooms" className="hover:text-[#D4AF37] transition-all duration-200 whitespace-nowrap py-2">Hạng Phòng & Giá</a>
                    <a href="#calculator" className="hover:bg-[#D4AF37] hover:text-[#0B2240] text-[#D4AF37] bg-[#0B2240] px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 transition-all duration-200 whitespace-nowrap text-[10px] xl:text-xs tracking-widest font-extrabold shadow-sm">Tính Giá Kỳ Nghỉ</a>
                    <a href="#experiences" className="hover:text-[#D4AF37] transition-all duration-200 whitespace-nowrap py-2">Trải Nghiệm</a>
                </div>

                <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <button onClick={() => navigate('/dang-nhap')} className="bg-slate-100 hover:bg-slate-200 text-[#0B2240] font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 text-[11px] xl:text-xs uppercase tracking-wider whitespace-nowrap">
                        <i className="fa-solid fa-lock"></i>
                        <span>Đăng Nhập</span>
                    </button>
                    <a href="tel:0383696666" className="bg-[#D4AF37] hover:bg-[#B89020] text-[#0B2240] font-extrabold px-4 py-2.5 xl:px-5 xl:py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-[#D4AF37]/30 transition-all duration-300 transform hover:-translate-y-0.5 text-[11px] xl:text-xs uppercase tracking-wider whitespace-nowrap">
                        <i className="fa-solid fa-phone-volume animate-pulse"></i>
                        <span>Đặt Phòng Ngay</span>
                    </a>
                </div>

                <button className="lg:hidden p-2 text-[#0B2240]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <i className={\`fa-solid \${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl\`}></i>
                </button>
            </div>
        </div>

        {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100">
            <div className="px-4 pt-2 pb-6 space-y-3 shadow-inner">
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B2240] hover:bg-slate-50 hover:text-[#D4AF37]">Giới Thiệu</a>
                <a href="#rooms" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B2240] hover:bg-slate-50 hover:text-[#D4AF37]">Hạng Phòng & Giá</a>
                <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B2240] hover:bg-slate-50 hover:text-[#D4AF37]">Tính Giá Kỳ Nghỉ</a>
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <button onClick={() => navigate('/dang-nhap')} className="w-full bg-slate-100 hover:bg-slate-200 text-[#0B2240] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
                        <i className="fa-solid fa-lock"></i> Đăng Nhập Quản Lý
                    </button>
                    <a href="tel:0383696666" className="w-full bg-[#0B2240] hover:bg-[#0B2240]/95 text-white text-center font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2">
                        <i className="fa-solid fa-phone"></i> Gọi Mr. Đạt
                    </a>
                </div>
            </div>
        </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center bg-[#051224] overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1600" alt="Infinity Hill Hotel" className="w-full h-full object-cover opacity-50 filter brightness-[0.75] contrast-105 transform scale-105 transition-transform duration-[12s] hover:scale-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051224] via-[#051224]/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-white">
            <div className="flex justify-center mb-8">
                <img src={LOGO_URL} alt="Infinity Hill" className="max-w-[280px] h-auto object-contain filter brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </div>
            
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-8xl font-black tracking-widest leading-tight mb-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                INFINITY HILL
            </h1>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-light text-[#D4AF37] tracking-widest mb-8 uppercase italic">
                Nơi Đồi Xanh Gặp Gỡ Đại Dương Kỳ Vĩ • Đảo Quan Lạn
            </h2>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-light mb-12">
                Tọa lạc lộng lẫy giữa thiên nhiên hoang sơ đảo Quan Lạn, tự hào mang phong cách tân cổ điển Châu Âu quý phái kết hợp tổ hợp cafe Glamping ngắm hoàng hôn sườn đồi thơ mộng.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="#calculator" className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#B89020] text-[#0B2240] font-extrabold text-sm px-8 py-4 rounded-xl shadow-xl transition-all uppercase tracking-wider">
                    Tính Dự Toán Kỳ Nghỉ
                </a>
            </div>
        </div>
      </section>

      {/* STORY */}
      <section id="about" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-5 space-y-8">
                    <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#0B2240] leading-tight">
                        Kiến Trúc Châu Âu<br/>Tân Cổ Điển Kiêu Sa
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-base">
                        Toạ lạc tại vị trí tựa sơn hướng hải trên hòn đảo Quan Lạn hoang sơ tuyệt đẹp, <strong>INFINITY HILL Hotel</strong> là sự giao thoa tuyệt mỹ giữa phong cách kiến trúc châu Âu tân cổ điển đẳng cấp và cảnh sắc mộng mơ của đảo khơi Vân Đồn.
                    </p>
                    <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-[#D4AF37] flex items-center gap-4 shadow-sm">
                        <div className="bg-[#D4AF37]/20 p-3.5 rounded-xl text-[#D4AF37]">
                            <i className="fa-solid fa-user-tie text-2xl"></i>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hỗ trợ tư vấn trực tiếp</p>
                            <p className="text-lg font-extrabold text-[#0B2240]">Mr. Đạt — 0383.696.666</p>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-7 grid grid-cols-12 gap-4">
                    <div className="col-span-12 rounded-3xl overflow-hidden shadow-2xl relative">
                        <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" alt="Infinity Hill" className="w-full h-96 object-cover" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="py-24 bg-[#0B2240] text-white relative">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
                <h2 className="font-serif text-3xl sm:text-5xl font-extrabold mt-3 mb-4 text-white">Công Cụ Ước Tính Giá Phòng Kỳ Nghỉ</h2>
                <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">Vui lòng chọn số đêm nghỉ của bạn để nhận báo giá chi tiết</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                    <div>
                        <label className="block text-xs uppercase font-bold text-[#D4AF37] mb-2.5">1. Lựa chọn hạng phòng nghỉ:</label>
                        <select value={calcRoom} onChange={e => setCalcRoom(e.target.value)} className="w-full bg-[#0B2240]/90 border border-white/30 rounded-2xl px-4 py-4 text-white focus:outline-none">
                            <option value="room1">Phòng 1G (King Size)</option>
                            <option value="room2">Phòng 2G (Twin Room)</option>
                            <option value="room3">Phòng 3G (Triple Room)</option>
                            <option value="room4">Phòng 1,2G VIP (Luxury)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-[#D4AF37] mb-2.5">Số Đêm Ngày Thường (T2 - T5):</label>
                            <div className="flex items-center text-black">
                                <button className="bg-slate-200 w-12 h-12 rounded-l-xl font-bold" onClick={() => setCalcWeekdays(Math.max(0, calcWeekdays - 1))}>-</button>
                                <input type="number" className="w-full h-12 text-center font-bold" value={calcWeekdays} onChange={e => setCalcWeekdays(parseInt(e.target.value)||0)} />
                                <button className="bg-slate-200 w-12 h-12 rounded-r-xl font-bold" onClick={() => setCalcWeekdays(calcWeekdays + 1)}>+</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#D4AF37] mb-2.5">Số Đêm Cuối Tuần (T6 - CN):</label>
                            <div className="flex items-center text-black">
                                <button className="bg-slate-200 w-12 h-12 rounded-l-xl font-bold" onClick={() => setCalcWeekends(Math.max(0, calcWeekends - 1))}>-</button>
                                <input type="number" className="w-full h-12 text-center font-bold" value={calcWeekends} onChange={e => setCalcWeekends(parseInt(e.target.value)||0)} />
                                <button className="bg-slate-200 w-12 h-12 rounded-r-xl font-bold" onClick={() => setCalcWeekends(calcWeekends + 1)}>+</button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-4">
                        <span className="block text-xs uppercase tracking-wider font-bold text-[#D4AF37]">Thông tin khách đặt phòng (Để duyệt booking):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-black">
                            <input type="text" value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Họ và tên khách" className="w-full h-12 rounded-xl px-4" />
                            <input type="text" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="Số điện thoại" className="w-full h-12 rounded-xl px-4" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 text-slate-800 flex flex-col justify-between shadow-2xl">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                            <span className="text-xs uppercase tracking-widest text-slate-400 font-extrabold">Bảng Dự Kiến Tạm Tính</span>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl sm:text-5xl font-black text-[#0B2240] tracking-tight">{getCalcTotal().toLocaleString('vi-VN')}</span> <span className="font-bold text-[#0B2240] text-lg">đ</span>
                        </div>
                        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                            <div className="flex justify-between items-center">
                                <span>Giá trị tiền phòng:</span>
                                <span className="font-bold text-slate-900">{getCalcTotal().toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button onClick={submitBookingRequest} className="w-full text-center bg-[#0B2240] hover:bg-[#D4AF37] text-white font-extrabold py-4 rounded-xl shadow-lg transition-all">
                            Gửi thông tin & Liên hệ Zalo
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="bg-[#051224] text-white pt-20 pb-24 border-t border-[#D4AF37]/20 relative text-center">
          <p>© 2026 INFINITY HILL HOTEL. Tất cả các quyền sở hữu trí tuệ được bảo lưu.</p>
          <div className="flex justify-center mt-4">
              <button onClick={() => navigate('/dang-nhap')} className="text-slate-400 hover:text-white underline font-medium">Đăng Nhập Quản Trị Hệ Thống</button>
          </div>
      </footer>
    </div>
  );
}
`;
fs.writeFileSync('src/components/LandingPage.tsx', code);
