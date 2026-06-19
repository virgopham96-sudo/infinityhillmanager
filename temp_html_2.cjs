const fs = require('fs');

const p2 = `
    <section id="about" class="py-24 bg-white relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                <div class="lg:col-span-5 space-y-8">
                    <div class="flex items-center gap-3">
                        <span class="h-[2px] w-12 bg-luxury-gold"></span>
                        <span class="text-luxury-gold font-bold uppercase tracking-widest text-xs">Biệt Thự Giữa Thiên Đường</span>
                    </div>
                    <h2 class="font-luxury-serif text-4xl sm:text-5xl font-extrabold text-luxury-blue leading-tight">Kiến Trúc Châu Âu<br>Tân Cổ Điển Kiêu Sa</h2>
                    <p class="text-slate-600 leading-relaxed text-base">Toạ lạc tại vị trí tựa sơn hướng hải trên hòn đảo Quan Lạn hoang sơ tuyệt đẹp, <strong>INFINITY HILL Hotel</strong> là sự giao thoa tuyệt mỹ giữa phong cách kiến trúc châu Âu tân cổ điển đẳng cấp và cảnh sắc mộng mơ của đảo khơi Vân Đồn.</p>
                    <p class="text-slate-600 leading-relaxed text-base">Khách sạn sở hữu khu khuôn viên vườn thượng uyển rộng rãi, trang hoàng lộng lẫy bằng hệ đá tự nhiên, cây cọ kiêu sa và rực rỡ ánh sáng vàng ấm áp lúc hoàng hôn buông xuống. Bên sườn đồi lãng mạn là quán <strong>Glamping Cafe</strong> sành điệu - tọa độ hoàn hảo để tận hưởng những buổi tối lãng mạn lộng gió biển.</p>
                    <div class="p-6 bg-slate-50 rounded-2xl border-l-4 border-luxury-gold flex items-center gap-4 shadow-sm">
                        <div class="bg-luxury-gold/20 p-3.5 rounded-xl text-luxury-gold"><i class="fa-solid fa-user-tie text-2xl"></i></div>
                        <div>
                            <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">Hỗ trợ tư vấn trực tiếp</p>
                            <p class="text-lg font-extrabold text-luxury-blue"><span class="manager-name-display">Mr. Đạt</span> — <span class="hotline-text-display">0383.696.666</span></p>
                            <p class="text-xs text-green-600 font-semibold mt-0.5"><i class="fa-solid fa-circle text-[8px] animate-pulse mr-1"></i>Đang trực tuyến</p>
                        </div>
                    </div>
                </div>
                <div class="lg:col-span-7 grid grid-cols-12 gap-4">
                    <div class="col-span-12 rounded-3xl overflow-hidden shadow-2xl relative group">
                        <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" alt="Infinity Hill Hotel" class="w-full h-96 object-cover transition-transform duration-700 group-hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent flex flex-col justify-end p-6">
                            <span class="text-xs text-luxury-gold font-bold uppercase tracking-wider">Ảnh Thực Tế</span>
                            <h3 class="text-white font-luxury-serif text-xl font-bold mt-1">Hệ sân vườn ngập tràn ánh sáng lung linh</h3>
                        </div>
                    </div>
                    <div class="col-span-6 rounded-2xl overflow-hidden shadow-lg relative group h-44">
                        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600" alt="Lối dạo" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                        <div class="absolute inset-0 bg-black/30 flex items-end p-4"><p class="text-white text-xs font-bold">Lối đi dạo ban ngày</p></div>
                    </div>
                    <div class="col-span-6 rounded-2xl overflow-hidden shadow-lg relative group h-44">
                        <img src="https://images.unsplash.com/photo-1533587845331-5768296a2b8e?auto=format&fit=crop&q=80&w=600" alt="Cafe" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                        <div class="absolute inset-0 bg-black/30 flex items-end p-4"><p class="text-white text-xs font-bold">Glamping Cafe Sườn Đồi</p></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ROOMS & RATES SECTION -->
    <section id="rooms" class="py-24 bg-slate-100 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <div class="flex justify-center mb-6">
                    <img src="https://lh3.googleusercontent.com/pw/AP1GczMk0hS3jdTwzJkHeGWSWRjqaUS5YYGFB5KbMDMeFlBdpving26XUlJjNeBV5Hgu1LMFBhJva188u3oI3ki789nXcjxoVTfjk5LDpRs7y0gszs7daOP8=s512" 
                         alt="Infinity Hill" 
                         class="max-w-[150px] w-full h-auto object-contain transition-transform duration-300 hover:scale-105">
                </div>
                <h2 class="font-luxury-serif text-4xl sm:text-5xl font-extrabold text-luxury-blue mb-4">Hạng Phòng Hoàng Gia & Báo Giá</h2>
                <p class="text-slate-600 text-sm sm:text-base">Các phòng ngủ được thiết kế tinh giản hiện đại, sử dụng nội thất gỗ cao cấp ấm cúng, thiết bị điện máy tiện ích chuẩn 5 sao.</p>
                <div class="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-5 py-3 mt-8 shadow-sm text-xs sm:text-sm text-left max-w-2xl">
                    <div class="bg-amber-500 text-white rounded-full p-1.5 flex items-center justify-center animate-pulse"><i class="fa-solid fa-circle-exclamation text-base"></i></div>
                    <div><strong class="font-bold">Lưu ý quan trọng:</strong> Mức giá ưu đãi đặc biệt này được áp dụng đi kèm với điều kiện đặt ăn tại hệ thống nhà hàng của khách sạn (số bữa ăn tối thiểu bằng số ngày lưu trú).</div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <!-- Room 1 -->
                <div class="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col justify-between group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div class="relative overflow-hidden h-56">
                        <img src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800" alt="Phòng 1" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-4 left-4 bg-luxury-blue/90 text-luxury-gold text-xs font-bold uppercase tracking-widest py-1 px-3.5 rounded-full border border-luxury-gold/30">Giường King</div>
                    </div>
                    <div class="p-6 flex-grow">
                        <h3 class="font-luxury-serif text-xl font-bold text-luxury-blue mb-2">Phòng 1G (King Size)</h3>
                        <p class="text-xs text-slate-500 mb-4"><i class="fa-solid fa-arrows-left-right mr-1.5"></i> Giường rộng: 1.8m x 2m2</p>
                        <div class="bg-slate-50 rounded-2xl p-4 my-4 space-y-2.5 border border-slate-100">
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 2 - Thứ 5:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room1-weekday">1.200.000 đ</span>
                            </div>
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 6 - Chủ Nhật:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room1-weekend">1.400.000 đ</span>
                            </div>
                        </div>
                        <ul class="text-xs text-slate-600 space-y-2 mt-4">
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Máy chiếu Mini thông minh Full HD</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Tủ lạnh mini & Điều hòa mát lạnh</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Buffet sáng cao cấp miễn phí</li>
                        </ul>
                    </div>
                    <div class="p-6 pt-0">
                        <a href="#calculator" onclick="selectRoomInCalculator('room1')" class="block w-full text-center bg-slate-50 hover:bg-luxury-gold hover:text-luxury-blue text-luxury-blue font-bold py-3 rounded-xl border border-slate-200 hover:border-luxury-gold transition-all duration-300 text-xs uppercase tracking-wider">Đặt Phòng & Tính Giá</a>
                    </div>
                </div>

                <!-- Room 2 -->
                <div class="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col justify-between group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div class="relative overflow-hidden h-56">
                        <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800" alt="Phòng 2" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-4 left-4 bg-luxury-blue/90 text-luxury-gold text-xs font-bold uppercase tracking-widest py-1 px-3.5 rounded-full border border-luxury-gold/30">2 Giường Đôi</div>
                    </div>
                    <div class="p-6 flex-grow">
                        <h3 class="font-luxury-serif text-xl font-bold text-luxury-blue mb-2">Phòng 2G (Twin Room)</h3>
                        <p class="text-xs text-slate-500 mb-4"><i class="fa-solid fa-arrows-left-right mr-1.5"></i> 2 Giường đôi: 1m6 x 2m</p>
                        <div class="bg-slate-50 rounded-2xl p-4 my-4 space-y-2.5 border border-slate-100">
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 2 - Thứ 5:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room2-weekday">1.400.000 đ</span>
                            </div>
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 6 - Chủ Nhật:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room2-weekend">1.600.000 đ</span>
                            </div>
                        </div>
                        <ul class="text-xs text-slate-600 space-y-2 mt-4">
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Rộng rãi, lý tưởng cho gia đình 4 người</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Bình nóng lạnh & máy sấy tóc tiện nghi</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Trà, Cafe, nước lọc setup mỗi ngày</li>
                        </ul>
                    </div>
                    <div class="p-6 pt-0">
                        <a href="#calculator" onclick="selectRoomInCalculator('room2')" class="block w-full text-center bg-slate-50 hover:bg-luxury-gold hover:text-luxury-blue text-luxury-blue font-bold py-3 rounded-xl border border-slate-200 hover:border-luxury-gold transition-all duration-300 text-xs uppercase tracking-wider">Đặt Phòng & Tính Giá</a>
                    </div>
                </div>

                <!-- Room 3 -->
                <div class="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col justify-between group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div class="relative overflow-hidden h-56">
                        <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800" alt="Phòng 3" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-4 left-4 bg-luxury-blue/90 text-luxury-gold text-xs font-bold uppercase tracking-widest py-1 px-3.5 rounded-full border border-luxury-gold/30">3 Giường Đơn</div>
                    </div>
                    <div class="p-6 flex-grow">
                        <h3 class="font-luxury-serif text-xl font-bold text-luxury-blue mb-2">Phòng 3G (Triple Room)</h3>
                        <p class="text-xs text-slate-500 mb-4"><i class="fa-solid fa-arrows-left-right mr-1.5"></i> 3 Giường tiện lợi cho nhóm</p>
                        <div class="bg-slate-50 rounded-2xl p-4 my-4 space-y-2.5 border border-slate-100">
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 2 - Thứ 5:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room3-weekday">1.600.000 đ</span>
                            </div>
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 6 - Chủ Nhật:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room3-weekend">1.800.000 đ</span>
                            </div>
                        </div>
                        <ul class="text-xs text-slate-600 space-y-2 mt-4">
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Thiết kế mở tối ưu hóa diện tích sinh hoạt</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Điều hòa 2 chiều công suất lớn mát rượi</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Wifi băng thông rộng phủ sóng tốc độ cao</li>
                        </ul>
                    </div>
                    <div class="p-6 pt-0">
                        <a href="#calculator" onclick="selectRoomInCalculator('room3')" class="block w-full text-center bg-slate-50 hover:bg-luxury-gold hover:text-luxury-blue text-luxury-blue font-bold py-3 rounded-xl border border-slate-200 hover:border-luxury-gold transition-all duration-300 text-xs uppercase tracking-wider">Đặt Phòng & Tính Giá</a>
                    </div>
                </div>

                <!-- Room 4 -->
                <div class="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col justify-between group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div class="relative overflow-hidden h-56">
                        <img src="https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=800" alt="Phòng VIP" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-4 left-4 bg-luxury-gold text-luxury-blue text-xs font-black uppercase tracking-widest py-1 px-4 rounded-full border border-luxury-gold shadow-md">VIP Luxury</div>
                    </div>
                    <div class="p-6 flex-grow">
                        <h3 class="font-luxury-serif text-xl font-bold text-luxury-blue mb-2">Phòng 1,2G VIP</h3>
                        <p class="text-xs text-slate-500 mb-4"><i class="fa-solid fa-gem mr-1.5 text-luxury-gold"></i> Tầm nhìn hướng vườn cực đẹp</p>
                        <div class="bg-slate-50 rounded-2xl p-4 my-4 space-y-2.5 border border-slate-100">
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 2 - Thứ 5:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room4-weekday">1.700.000 đ</span>
                            </div>
                            <div class="flex justify-between items-center text-xs sm:text-sm">
                                <span class="text-slate-500 font-medium whitespace-nowrap">Thứ 6 - Chủ Nhật:</span>
                                <span class="font-extrabold text-luxury-blue text-base whitespace-nowrap" id="price-room4-weekend">1.900.000 đ</span>
                            </div>
                        </div>
                        <ul class="text-xs text-slate-600 space-y-2 mt-4">
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Nội thất sang trọng chuẩn châu Âu quý phái</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Setup quà tặng đặc biệt từ Mr. Đạt</li>
                            <li class="flex items-center gap-2"><i class="fa-solid fa-circle-check text-green-500"></i> Ưu tiên nâng hạng check-in/out linh hoạt</li>
                        </ul>
                    </div>
                    <div class="p-6 pt-0">
                        <a href="#calculator" onclick="selectRoomInCalculator('room4')" class="block w-full text-center bg-luxury-blue hover:bg-luxury-gold hover:text-luxury-blue text-white hover:text-luxury-blue font-bold py-3 rounded-xl transition-all duration-300 text-xs uppercase tracking-wider">Đặt Hạng VIP Ngay</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
`;
fs.writeFileSync('temp_p2.txt', p2);
