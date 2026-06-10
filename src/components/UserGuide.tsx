import React from "react";
import { BookOpen, Map, CalendarRange, Users, BarChart3, Save, Link2 } from "lucide-react";

export default function UserGuide() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          Hướng Dẫn Sử Dụng Hệ Thống
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
          Tài liệu hướng dẫn chi tiết các tính năng và cách vận hành khách sạn trên phần mềm.
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1 */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 hidden md:block opacity-5">
            <Map className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">1. Sơ đồ phòng & Thao tác cơ bản</h2>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none relative z-10">
            <p>Trang <strong>Sơ đồ phòng</strong> (Dashboard) là nơi bạn nhìn thấy tổng quan tình trạng của toàn bộ các phòng trong khách sạn theo thời gian thực (Trống, Đang sử dụng, Đã đặt trước, hoặc Bảo trì).</p>
            
            <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-800 dark:text-slate-200">Cách thao tác với một phòng:</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li><strong>Mở menu phòng:</strong> Bấm trực tiếp vào bộ đếm phòng trên sơ đồ.</li>
              <li><strong>Khách lẻ Check-in:</strong> Khi phòng trống, chọn chức năng thao tác, điền thông tin (tên, cọc, ngày đi) để nhận phòng ngay lập tức.</li>
              <li><strong>Thêm lịch đặt trước:</strong> Cho phép bạn đặt lịch giữ phòng vào một ngày trong tương lai.</li>
              <li><strong>Check-out (Trả phòng):</strong> Khi khách trả, chọn Check-out. Hệ thống sẽ tự động tổng hợp <em>Tiền phòng</em> (dựa theo số ngày), <em>Tiền đặt cọc</em> (đã đóng), và cho phép bạn cộng thêm <em>Minibar</em> hoặc <em>Phụ thu/ Đền bù</em>. Giao dịch sẽ lưu vào Doanh thu.</li>
              <li><strong>Bảo trì/Dọn dẹp:</strong> Chuyển trạng thái phòng sang Bảo trì để không thể thao tác check-in. Khách sạn có thể quản lý được buồng phòng đang không sẵn sàng phục vụ.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-2 text-slate-800 dark:text-slate-200">Lịch sử phòng & Lịch đặt trước:</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-2">Khi mở chi tiết một phòng bất kỳ, bạn sẽ thấy các tab chức năng hữu ích:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li><strong>Lịch sử phòng:</strong> Chuyển sang thẻ này để kiểm tra danh sách các lượt lưu trú trước đây của phòng, bao gồm thông tin tên khách, khoảng thời gian ở và ghi chú lịch sử.</li>
              <li><strong>Lịch đặt trước:</strong> Thẻ này liệt kê các khoảng thời gian phòng đã được đặt giữ trong tương lai. Bạn có thể xóa một lịch đặt trước hoặc tạo mới tại đây.</li>
              <li><strong>Xem nhanh thông tin khách đặt:</strong> Đặc biệt, trong thẻ <em>Lịch đặt trước</em>, bạn chỉ cần <strong>bấm vào tên khách hàng</strong> để hệ thống tự động mở ngay bảng chi tiết của khách đặt/đoàn khách đó (tương tự như khi thao tác tìm kiếm ở mục <em>Xem theo khách đặt</em>). Hãy tận dụng lối tắt này để kiểm tra hoặc nhận phòng nhanh cho đoàn.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-2 text-slate-800 dark:text-slate-200">Đặt nhiều phòng cùng lúc (Cho khách đoàn):</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>Sử dụng nút <strong className="text-blue-600 dark:text-blue-400">+ Thêm khách/Đoàn</strong> màu xanh bên phải Sơ đồ phòng.</li>
              <li>Cho phép ghi tên đoàn khách, nhập ngày Check-in/Check-out.</li>
              <li>Tích chọn vào nhiều phòng trống và tạo lịch cùng lúc với chung 1 thông tin cọc.</li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 hidden md:block opacity-5">
            <CalendarRange className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">2. Hiện trạng đặt phòng (Lịch theo tháng)</h2>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none relative z-10">
            <p>Trang <strong>Hiện trạng đặt phòng</strong> cung cấp góc nhìn toàn diện theo lịch trực quan 30/31 ngày của tất cả phòng.</p>
            
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li><strong>Quan sát trạng thái:</strong> Các ô được tô màu giúp nhận biết ngày nào Trống, ngày nào Đang có khách hoặc ngày nào có lịch Đã đặt trước.</li>
              <li><strong>Xem nhanh thông tin:</strong> Rê chuột (hover) vào lịch Đã đặt trước hoặc Đang sử dụng để xem nhanh popup thông tin khách hàng, số điện thoại, ngày check-in/out.</li>
              <li><strong>Tiện lợi thao tác:</strong> Bấm trực tiếp vào các ô (ngày) trong lịch của một số phòng để mở nhanh bảng điền khách đặt cho ngày đó.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 hidden md:block opacity-5">
            <Users className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">3. Xem theo khách đặt & Quản lý đoàn</h2>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none relative z-10">
            <p>Trang <strong>Xem theo khách đặt</strong> giúp bạn quản lý từng hồ sơ khách lẻ và khách đoàn một cách tập trung.</p>
            
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>Danh sách được tổng hợp những booking có chung <em>Tên khách hàng/Tên đoàn</em>.</li>
              <li>Hiển thị những phòng mà khách/đoàn đã đặt. Ghi chú rõ Loại phòng (G1, G2, G3).</li>
              <li><strong>Chỉnh sửa đoàn:</strong> Bấm vào một dòng tên đoàn khách, bảng chi tiết sẽ hiện lên. Bạn có thể <em>Thêm phòng mới vào đoàn</em>, hoặc thao tác thay đổi phòng, cập nhật cọc chung toàn bộ nhanh chóng. Nhận phòng hàng loạt cho các phòng thuộc đoàn.</li>
              <li><strong>Xuất Excel:</strong> Bạn có thể xuất danh sách khách trong bất kỳ lúc nào để chuyển cho các cơ quan/ bộ phận liên quan thống kê lưu trú.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 hidden md:block opacity-5">
            <BarChart3 className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">4. Báo cáo doanh thu & Dịch vụ</h2>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none relative z-10">
            <p>Sau khi trả phòng (Check-out), mọi giao dịch đều sẽ tự động chuyển sang trang <strong>Báo cáo doanh thu</strong>.</p>
            
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li><strong>Xem doanh thu:</strong> Xem theo Ngày, theo Tháng, hoặc theo Năm. Biểu đồ thông báo tỷ lệ tăng trưởng so với kỳ trước.</li>
              <li><strong>Sổ giao dịch:</strong> Hiển thị đầy đủ khách hàng nào trả phòng lúc nào và chi trả bao nhiêu.</li>
              <li><strong>Chỉnh sửa hóa đơn:</strong> Nếu xảy ra sai sót hoặc khách mua thêm dịch vụ sau cùng, bạn có thể <em>bấm vào tên khách hàng</em> trong Lịch sử giao dịch để điều chỉnh: Giá phòng, Trừ cọc, cập nhật sử dụng số lượng mặt hàng Minibar (Snack, nước, bim bim...) hay thêm phụ thu. Tổng thu thực tế sẽ tự động tính toán lại.</li>
              <li><strong>Bảo mật khi xóa:</strong> Nếu bạn muốn xóa một giao dịch bị lỗi/ tạo nhầm, hệ thống sẽ yêu cầu một mật khẩu bảo mật trước khi cho phép xóa hoá đơn.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 hidden md:block opacity-5">
            <Save className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Save className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">5. Dữ liệu Hệ thống & Cài đặt bổ sung</h2>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none relative z-10">
            <ul className="list-disc pl-5 space-y-4 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Sao lưu / Phục hồi:</strong> Vì mọi dữ liệu vận hành hiện tại được lưu ở LocalStorage, tính năng Sao lưu cho phép bạn tải file <code>.json</code> máy tính. Để đề phòng sự cố trên trình duyệt/ máy, hãy chủ động Export/Sao lưu dữ liệu định kỳ mỗi tuần hoặc mỗi ngày.
              </li>
              <li>
                <strong>Chế độ ban đêm (Dark Mode):</strong> Cung cấp giao diện làm việc tối màu bằng việc bấm vào biểu tượng "Mặt trăng" hoặc "Mặt trời" trên thanh menu trên cùng, giúp bạn dịu mắt hơn khi thao tác phần mềm vào buổi tối muộn tại khách sạn.
              </li>
              <li>
                <strong>Ghi nhớ đăng nhập:</strong> Tại màn hình Login, nếu tích vào "Ghi nhớ đăng nhập", trình duyệt sẽ ghi nhớ và duy trì đăng nhập cho các lần thao tác sau mà không cần đăng nhập lại với mật khẩu.
              </li>
            </ul>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center pb-8 opacity-60">
          <p className="text-slate-500 font-medium text-sm">Hướng dẫn kết thúc. Chúc bạn vận hành khách sạn thật thuận tiện và chuyên nghiệp.</p>
        </div>
      </div>
    </div>
  );
}
