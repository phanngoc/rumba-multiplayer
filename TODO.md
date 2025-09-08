## Logic phần server.
- Auto định danh user_id, save user_id ở localstorage của browser.
- Save 1 game vào database, vào bảng game_state (id, user_id, game_state, code, created_at, updated_at), ở đây user_id là người tạo ra game. Code từ động được generate có 6 ký tự (được dùng trong trường hợp mời user join game).
game_state chứa trạng thái hiện tại của game (PLAYING, COMPLETED, ERROR).
- Invite user join game, vào bảng game_invitation (id, user_id, game_id, created_at, updated_at).
    Việc mời thông qua link chứa code, hoặc copy code, thêm 1 trang nhập code.

## Trường hợp có 2 user cùng chơi.
- Ở màn hình user đầu tiên, có 1 button "Invite to play", khi click vào sẽ hiển thị 1 modal, modal này có 1 input để nhập code.
- Ở màn hình user thứ 2, có 1 button "Join game", khi click vào sẽ hiển thị 1 modal, modal này có 1 input để nhập code.
- Ở màn hình user1 sẽ hiển thị số ô còn trống của user2, để tạo độ gay cấn khi chơi, thúc user1 phải động não và chơi nhanh hơn.

