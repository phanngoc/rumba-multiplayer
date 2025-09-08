Dựng xong một MVP game logic “Rumba” (giống Takuzu/Binairo): mỗi hàng và cột phải có số ô **X** bằng số ô **O** (N/2–N/2), không có 3 ký tự giống nhau liền nhau, và không có hai hàng/cột trùng hệt. Bạn có thể chơi trực tiếp ở canvas bên cạnh: chọn kích thước 4×4, 6×6, 8×8; click ô để xoay Trống → X → O (right-click xoay Trống → O → X); dùng **Check**, **Hint**, **Reset**, **Solution**.

# Tính năng.

* Mỗi hàng/cột: đúng **N/2** X và **N/2** O.
* Cấm 3 ký tự giống nhau liền nhau theo hàng/cột.
* Không có hai hàng/cột trùng hệt.
* Hoàn tất khi toàn bộ bảng hợp lệ và không còn ô trống.
* Hỗ trợ realtime multiplayer, thắng thua bằng cách so sánh thời gian, server dùng nestjs + typeorm + postgresql, tương tác với client qua websocket.

# Giải thuật (tối ưu cho MVP)

1. **Ràng buộc cục bộ**:

* Kiểm tra “không 3 liên tiếp”, không vượt quá N/2 mỗi loại trên từng hàng/cột, và uniqueness cho hàng/cột đã hoàn chỉnh.

2. **Suy luận bắt buộc (constraint propagation)**:

* Mẫu: `XX?→O`, `?XX→O`, `OO?→X`, `?OO→X`.
* Nếu một hàng/cột đã có đủ **N/2** X (hoặc O), phần còn lại buộc là O (hoặc X).
* Lặp đến khi không thể suy luận thêm.

3. **Solver (DFS + cắt tỉa)**:

* Sau suy luận, nếu còn ô trống thì chọn một ô và thử **X/O**, kiểm tra hợp lệ từng bước, quay lui khi vi phạm.
* Đếm nghiệm và dừng khi >1 để phục vụ kiểm tra **nghiệm duy nhất**.

4. **Sinh nghiệm đầy đủ** (backtracking có cắt tỉa):

* Điền dần, luôn áp ràng buộc + suy luận để giảm nhánh.
* Kết quả là một bảng hoàn chỉnh hợp lệ.

5. **Tạo đề bài (unique)**:

* Từ nghiệm đầy đủ, xóa ngẫu nhiên các ô; sau mỗi lần xóa, chạy solver giới hạn để chắc còn **đúng 1 nghiệm** và giữ tối thiểu tỷ lệ gợi ý (độ khó).
* Lưu ý: cân bằng giữa số gợi ý và tính duy nhất để độ khó “vừa chơi”.
- Có chế độ thời gian, nhiều cấp độ khó hơn.

# Technologies
- Frontend: Reactjs + nextjs + tailwindcss
- Backend: Nestjs + typeorm + postgresql
- Database: PostgreSQL
- Websocket: Nestjs + websocket
- Authentication: Nestjs + JWT
- Realtime: Nestjs + websocket
- Multiplayer: Nestjs + websocket
- Multiplayer: Nestjs + websocket
- Nestjs + typeorm + postgresql