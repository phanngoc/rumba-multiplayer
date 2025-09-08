## Logic phần server.
- Auto generate user_id + nickname, save user_id + nickname ở localstorage của browser. Đồng thời đồng bộ lên server (table users)
- Khi new game => save vào database, bảng games (id, user_id, game_state, code, created_at, updated_at), ở đây user_id là người tạo ra game. Code từ động được generate có 6 ký tự (được dùng trong trường hợp mời user join game).
game_state chứa trạng thái hiện tại của game (PLAYING, COMPLETED, ERROR). board_size là kích thước của bảng (4, 6, 8). puzzle_json là đề puzzle, solution_json là nghiệm chuẩn.
- Invite user join game, vào bảng game_invitation (id, user_id, game_id, created_at, updated_at).
    Việc mời thông qua link chứa code, hoặc copy code, thêm 1 trang nhập code.

## Trường hợp có 2 user cùng chơi.
- Ở màn hình user đầu tiên, có 1 button "Invite to play", khi click vào sẽ hiển thị 1 modal, modal này có 1 input để nhập code.
- Ở màn hình user thứ 2, có 1 button "Join game", khi click vào sẽ hiển thị 1 modal, modal này có 1 input để nhập code.
- Ở màn hình user1 sẽ hiển thị số ô còn trống của user2, để tạo độ gay cấn khi chơi, thúc user1 phải động não và chơi nhanh hơn.

## Thêm tính năng
-- (Tuỳ chọn) nhật ký nước đi
CREATE TABLE game_moves (
  id            UUID PRIMARY KEY,
  game_id       UUID NOT NULL REFERENCES games(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  r             INT NOT NULL,
  c             INT NOT NULL,
  value         CHAR(1) CHECK (value IN ('X','O',' ')), -- ' ' = EMPTY
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
```
