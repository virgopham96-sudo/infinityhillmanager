const fs = require('fs');

const p4 = `
    <!-- PHOTO GALLERY SECTION -->
    <section id="gallery" class="py-24 bg-slate-50 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <span class="text-luxury-gold font-bold uppercase tracking-widest text-xs">Phóng Sự Thực Tế</span>
                <h2 class="font-luxury-serif text-4xl sm:text-5xl font-extrabold text-luxury-blue mt-2 mb-4">Thư Viện Ảnh Chụp Thực Tế</h2>
                <p class="text-slate-600 text-sm sm:text-base">Mọi bức ảnh tại đây đều được chụp trực quan từ thực tế phong cảnh của khách sạn, đem lại cho quý khách góc nhìn trung thực, sắc nét và trọn vẹn nhất.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div class="relative rounded-2xl overflow-hidden aspect-square shadow-md group cursor-pointer" onclick="openLightbox(0)">
                    <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800" alt="Gallery" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                </div>
                <div class="relative rounded-2xl overflow-hidden aspect-square shadow-md group cursor-pointer" onclick="openLightbox(1)">
                    <img src="https://images.unsplash.com/photo-1533587845331-5768296a2b8e?auto=format&fit=crop&q=80&w=800" alt="Gallery" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                </div>
                <div class="relative rounded-2xl overflow-hidden aspect-square shadow-md group cursor-pointer" onclick="openLightbox(2)">
                    <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" alt="Gallery" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                </div>
                <div class="relative rounded-2xl overflow-hidden aspect-square shadow-md group cursor-pointer" onclick="openLightbox(3)">
                    <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800" alt="Gallery" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                </div>
                <div class="relative rounded-2xl overflow-hidden aspect-square shadow-md group cursor-pointer" onclick="openLightbox(4)">
                    <img src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=800" alt="Gallery" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                </div>
            </div>
            <div class="mt-12 bg-gradient-to-r from-luxury-blue to-luxury-dark rounded-3xl p-8 sm:p-12 shadow-xl border border-luxury-gold/30 text-center relative overflow-hidden">
                <div class="relative z-10 space-y-6">
                    <span class="bg-luxury-gold/20 text-luxury-gold text-xs font-bold px-4 py-2 rounded-full border border-luxury-gold/30 uppercase tracking-widest">Tuyệt Tác Không Gian Số</span>
                    <h3 class="font-luxury-serif text-3xl sm:text-4xl font-extrabold text-white">Khám Phá Toàn Bộ Album Ảnh Chụp Thực Tế</h3>
                    <div class="pt-2">
                        <a href="https://photos.app.goo.gl/1urBhG4BShim3QUC6" target="_blank" class="inline-flex items-center gap-3 bg-luxury-gold hover:bg-luxury-goldhover text-luxury-blue font-black px-8 py-4.5 rounded-xl text-sm uppercase tracking-widest shadow-lg hover:shadow-luxury-gold/40 transition-all duration-300 transform hover:-translate-y-1 whitespace-nowrap"><i class="fa-brands fa-google-drive text-lg animate-pulse"></i> Truy Cập Google Photos</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- POLICIES -->
    <section class="py-24 bg-white relative">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
            <div class="bg-slate-50 rounded-3xl p-8 sm:p-12 shadow-md border border-slate-100 relative">
                <h3 class="font-luxury-serif text-3xl font-extrabold text-luxury-blue mb-10 text-center pb-4 border-b border-slate-200">Quy Định Chung & Chính Sách Hủy Phòng</h3>
                <div class="mt-12 p-6 bg-luxury-blue text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl border border-luxury-gold/30">
                    <div>
                        <p class="text-[10px] text-luxury-gold font-bold uppercase tracking-widest">Liên hệ chủ khách sạn</p>
                        <h4 class="text-lg sm:text-xl font-extrabold mt-0.5"><span class="manager-name-display">Mr. Đạt</span> (<span class="hotline-text-display">0383.696.666</span>)</h4>
                    </div>
                    <a href="tel:0383696666" id="about-hotline-btn" class="bg-luxury-gold hover:bg-luxury-goldhover text-luxury-blue font-extrabold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md transform hover:scale-105 whitespace-nowrap"><i class="fa-solid fa-phone mr-1"></i> Gọi Ngay Hỏi Đạt</a>
                </div>
            </div>
        </div>
    </section>

    <!-- FOOTER SECTION -->
    <footer class="bg-luxury-dark text-white pt-20 pb-24 border-t border-luxury-gold/20 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div class="space-y-5 col-span-1">
                    <a href="#" class="block" title="Trắng chủ">
                        <div class="bg-white p-4 rounded-2xl flex items-center justify-center shadow-lg max-w-[200px]">
                            <img src="https://lh3.googleusercontent.com/pw/AP1GczMk0hS3jdTwzJkHeGWSWRjqaUS5YYGFB5KbMDMeFlBdpving26XUlJjNeBV5Hgu1LMFBhJva188u3oI3ki789nXcjxoVTfjk5LDpRs7y0gszs7daOP8=s512" alt="Infinity Hill" class="w-full h-auto object-contain">
                        </div>
                    </a>
                    <p class="text-xs text-slate-300 leading-relaxed font-light">Tuyệt tác nghỉ dưỡng sang trọng tân cổ điển Châu Âu quý phái trên sườn đồi Quan Lạn, đem đến sự thanh tịnh, riêng tư và trọn vẹn chất lượng sống thượng đẳng.</p>
                </div>
                <div>
                    <h5 class="font-luxury-serif text-lg font-bold text-luxury-gold mb-6 tracking-wide">Khách Sạn</h5>
                    <ul class="space-y-3.5 text-xs text-slate-300 font-light">
                        <li><a href="#about" class="hover:text-luxury-gold transition-colors">Giới thiệu tổng quan</a></li>
                        <li><a href="#rooms" class="hover:text-luxury-gold transition-colors">Hạng phòng & Báo giá</a></li>
                        <li><a href="#calculator" class="hover:text-luxury-gold transition-colors">Bộ ước tính chi phí</a></li>
                        <li><a href="#experiences" class="hover:text-luxury-gold transition-colors">Ẩm thực hải sản</a></li>
                    </ul>
                </div>
                <div>
                    <h5 class="font-luxury-serif text-lg font-bold text-luxury-gold mb-6 tracking-wide">Giờ Tàu Chạy</h5>
                    <ul class="space-y-3.5 text-xs text-slate-300 font-light" id="footer-schedules">
                        <li><span class="block text-slate-400">Ao Tiên đi Quan Lạn:</span> 07h30, 09h00, 11h00, 13h30, 15h00</li>
                        <li><span class="block text-slate-400">Quan Lạn về Ao Tiên:</span> 07h30, 08h00, 10h00, 12h00, 14h00</li>
                    </ul>
                </div>
                <div>
                    <h5 class="font-luxury-serif text-lg font-bold text-luxury-gold mb-6 tracking-wide">Liên Hệ</h5>
                    <ul class="space-y-3 text-xs text-slate-300 font-light">
                        <li class="flex items-center gap-2.5">
                            <i class="fa-solid fa-phone text-luxury-gold"></i>
                            <span>Số hotline: <strong><span class="hotline-text-display">0383.696.666</span></strong></span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="flex justify-center mt-4">
                <button onclick="window.parent.location.href='/dang-nhap'" class="text-slate-400 hover:text-white underline font-medium">Đăng Nhập Quản Trị Hệ Thống</button>
            </div>
            <div class="pt-8 border-t border-white/15 text-center text-xs text-slate-400 font-light space-y-2">
                <p>© 2026 INFINITY HILL HOTEL. Tất cả các quyền sở hữu trí tuệ được bảo lưu.</p>
            </div>
        </div>
    </footer>

    <!-- LIGHTBOX MODAL -->
    <div id="lightbox" class="fixed inset-0 bg-black/95 z-50 hidden flex-col items-center justify-center p-4">
        <button class="absolute top-6 right-6 text-white hover:text-luxury-gold text-3xl transition-colors" onclick="closeLightbox()">&times;</button>
        <button class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-luxury-gold text-3xl transition-colors px-4 py-2" onclick="changeSlide(-1)">&#10094;</button>
        <button class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-luxury-gold text-3xl transition-colors px-4 py-2" onclick="changeSlide(1)">&#10095;</button>
        <div class="max-w-4xl max-h-[80vh] flex flex-col justify-center items-center">
            <img id="lightbox-img" src="" alt="Preview" class="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain">
            <p id="lightbox-caption" class="text-white text-sm sm:text-base font-medium mt-6 text-center max-w-lg px-4 italic"></p>
        </div>
    </div>

    <!-- FLOATING HOTLINE -->
    <div class="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <a href="https://zalo.me/0383696666" id="float-zalo-btn" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white p-4.5 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"><i class="fa-solid fa-comments text-xl"></i></a>
        <a href="tel:0383696666" id="float-hotline-btn" class="bg-luxury-gold hover:bg-luxury-goldhover text-luxury-blue p-4.5 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 animate-bounce"><i class="fa-solid fa-phone-volume text-xl"></i></a>
    </div>

    <script>
        const galleryItems = [
            { src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200", caption: "Toàn cảnh kiến trúc cổ điển" },
            { src: "https://images.unsplash.com/photo-1533587845331-5768296a2b8e?auto=format&fit=crop&q=80&w=1200", caption: "Glamping Cafe sườn đồi" },
            { src: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1200", caption: "Vườn hoa đá sỏi nội khu" },
            { src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200", caption: "Phòng ngủ châu Âu" },
            { src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=1200", caption: "Phòng tắm hiện đại vintage" }
        ];

        let currentLightboxIndex = 0;
        let hotelState = {
            hotline: "0383.696.666", managerName: "Mr. Đạt",
            mapsUrl: "https://maps.app.goo.gl/MXZdbN9LWCFTfqeA8",
            goSchedules: ["07h30", "09h00", "11h00", "13h30", "15h00"],
            returnSchedules: ["07h30", "08h00", "10h00", "12h00", "14h00"],
            rooms: {
                room1: { name: "Phòng 1G (King Size)", weekday: 1200000, weekend: 1400000 },
                room2: { name: "Phòng 2G (Twin Room)", weekday: 1400000, weekend: 1600000 },
                room3: { name: "Phòng 3G (Triple Room)", weekday: 1600000, weekend: 1800000 },
                room4: { name: "Phòng 1,2G VIP", weekday: 1700000, weekend: 1900000 }
            }
        };

        function loadState() {
            const savedState = localStorage.getItem("infinity_hill_hotel_state");
            if (savedState) {
                try { hotelState = JSON.parse(savedState); } catch (e) {}
            }
            renderLiveUI();
        }

        function renderLiveUI() {
            document.querySelectorAll(".hotline-text-display").forEach(el => el.innerText = hotelState.hotline);
            document.querySelectorAll(".manager-name-display").forEach(el => el.innerText = hotelState.managerName);
            
            const cleanPhone = hotelState.hotline.replace(/\\./g, "").trim();
            document.getElementById("top-hotline-text").href = \`tel:\${cleanPhone}\`;
            document.getElementById("nav-hotline-btn").href = \`tel:\${cleanPhone}\`;
            
            document.getElementById("price-room1-weekday").innerText = hotelState.rooms.room1.weekday.toLocaleString('vi-VN') + " đ";
            document.getElementById("price-room1-weekend").innerText = hotelState.rooms.room1.weekend.toLocaleString('vi-VN') + " đ";
            document.getElementById("price-room2-weekday").innerText = hotelState.rooms.room2.weekday.toLocaleString('vi-VN') + " đ";
            document.getElementById("price-room2-weekend").innerText = hotelState.rooms.room2.weekend.toLocaleString('vi-VN') + " đ";
            document.getElementById("price-room3-weekday").innerText = hotelState.rooms.room3.weekday.toLocaleString('vi-VN') + " đ";
            document.getElementById("price-room3-weekend").innerText = hotelState.rooms.room3.weekend.toLocaleString('vi-VN') + " đ";
            document.getElementById("price-room4-weekday").innerText = hotelState.rooms.room4.weekday.toLocaleString('vi-VN') + " đ";
            document.getElementById("price-room4-weekend").innerText = hotelState.rooms.room4.weekend.toLocaleString('vi-VN') + " đ";

            const goContainer = document.getElementById("schedule-go");
            goContainer.innerHTML = hotelState.goSchedules.map(time => \`<div class="bg-luxury-blue hover:bg-luxury-gold text-white hover:text-luxury-blue rounded-xl py-3 font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer">\${time}</div>\`).join("");
            
            const returnContainer = document.getElementById("schedule-return");
            returnContainer.innerHTML = hotelState.returnSchedules.map(time => \`<div class="bg-luxury-blue hover:bg-luxury-gold text-white hover:text-luxury-blue rounded-xl py-3 font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer">\${time}</div>\`).join("");

            calculateVacation();
            calculateTickets();
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            if (menu.classList.contains('hidden')) {
                menu.classList.remove('hidden');
            } else {
                menu.classList.add('hidden');
            }
        }

        function adjustCount(inputId, amount) {
            const input = document.getElementById(inputId);
            let val = parseInt(input.value) || 0;
            val += amount;
            if (val < 0) val = 0;
            input.value = val;
            if (inputId.startsWith('calc')) calculateVacation();
            else if (inputId.startsWith('ticket')) calculateTickets();
        }

        function selectRoomInCalculator(roomKey) {
            document.getElementById('calc-room').value = roomKey;
            calculateVacation();
        }

        function calculateVacation() {
            const selectedRoomKey = document.getElementById('calc-room').value;
            const roomInfo = hotelState.rooms[selectedRoomKey] || hotelState.rooms.room1;
            const weekdaysCount = Math.max(0, parseInt(document.getElementById('calc-weekdays').value) || 0);
            const weekendsCount = Math.max(0, parseInt(document.getElementById('calc-weekends').value) || 0);

            const totalRoomCost = (weekdaysCount * roomInfo.weekday) + (weekendsCount * roomInfo.weekend);
            document.getElementById('calc-total').innerText = totalRoomCost.toLocaleString('vi-VN');
            document.getElementById('detail-room-cost').innerText = totalRoomCost.toLocaleString('vi-VN') + ' đ';

            const cleanPhone = hotelState.hotline.replace(/\\./g, "").trim();
            const message = encodeURIComponent(\`Chào \${hotelState.managerName}, tôi muốn đặt phòng tại Infinity Hill:\\n- Hạng phòng: \${roomInfo.name}\\n- Số đêm thường: \${weekdaysCount} đêm\\n- Số đêm cuối tuần: \${weekendsCount} đêm\\n- Tổng tiền phòng dự tính: \${totalRoomCost.toLocaleString('vi-VN')} VNĐ\`);
            document.getElementById('zalo-link').href = \`https://zalo.me/\${cleanPhone}?text=\${message}\`;
        }

        function submitBookingRequest() {
            const name = document.getElementById("client-name").value.trim();
            const phone = document.getElementById("client-phone").value.trim();
            const selectedRoomKey = document.getElementById('calc-room').value;
            const roomInfo = hotelState.rooms[selectedRoomKey] || hotelState.rooms.room1;
            const total = document.getElementById('detail-room-cost').innerText;

            if (!name || !phone) return alert("Vui lòng điền đầy đủ Họ tên và SĐT!");

            const savedState = JSON.parse(localStorage.getItem("infinity_hill_hotel_state") || "{}");
            if (!savedState.bookings) savedState.bookings = [];
            savedState.bookings.unshift({
                id: "IF-" + Math.floor(1000 + Math.random() * 9000),
                clientName: name, phone: phone,
                roomType: roomInfo.name,
                duration: \`\${document.getElementById('calc-weekdays').value} đêm thường, \${document.getElementById('calc-weekends').value} đêm cuối tuần\`,
                total: total, status: "Chờ xác nhận"
            });
            localStorage.setItem("infinity_hill_hotel_state", JSON.stringify(savedState));
            
            alert("Đặt phòng thành công!");
        }

        function calculateTickets() {
            const adultsCount = Math.max(0, parseInt(document.getElementById('ticket-adults').value) || 0);
            const kidsCount = Math.max(0, parseInt(document.getElementById('ticket-kids').value) || 0);
            const tripMultiplier = parseInt(document.querySelector('input[name="trip-type"]:checked').value) || 2;

            const totalBoatCost = ((adultsCount * 250000) + (kidsCount * 200000)) * tripMultiplier;
            const totalPortCost = ((adultsCount * 50000) + (kidsCount * 20000)) * tripMultiplier;
            const grandTotal = totalBoatCost + totalPortCost;

            document.getElementById('ticket-total').innerText = grandTotal.toLocaleString('vi-VN');
            document.getElementById('detail-ticket-only').innerText = totalBoatCost.toLocaleString('vi-VN') + ' đ';
            document.getElementById('detail-port-only').innerText = totalPortCost.toLocaleString('vi-VN') + ' đ';
        }

        function openLightbox(index) {
            currentLightboxIndex = index;
            document.getElementById('lightbox-img').src = galleryItems[index].src;
            document.getElementById('lightbox-caption').innerText = galleryItems[index].caption;
            document.getElementById('lightbox').classList.remove('hidden');
            document.getElementById('lightbox').classList.add('flex');
        }

        function closeLightbox() {
            document.getElementById('lightbox').classList.add('hidden');
            document.getElementById('lightbox').classList.remove('flex');
        }

        function changeSlide(direction) {
            currentLightboxIndex += direction;
            if (currentLightboxIndex >= galleryItems.length) currentLightboxIndex = 0;
            else if (currentLightboxIndex < 0) currentLightboxIndex = galleryItems.length - 1;
            document.getElementById('lightbox-img').src = galleryItems[currentLightboxIndex].src;
            document.getElementById('lightbox-caption').innerText = galleryItems[currentLightboxIndex].caption;
        }

        window.onload = loadState;
    </script>
</body>
</html>
`;
fs.writeFileSync('temp_p4.txt', p4);
