Tuyệt — dưới đây là **bản step-by-step, gọn – rõ – chạy được** để Claude Code dựng nhanh backend + client cho MVP “Rumba” 1–2 người chơi. (Bạn có thể giữ ngôn ngữ/stack tuỳ ý: Node/Express + Postgres/Prisma hoặc Laravel + MySQL; đặc tả dưới neutral.)

# 0) Chuẩn bị nhanh (suggestion)

* **Server**: Node 20 + Express + Prisma + PostgreSQL (hoặc Laravel 10 + Eloquent + MySQL).
* **Realtime**: WebSocket (Socket.IO hoặc ws).
* **Client**: React (app MVP hiện có).
* **Build**: Docker Compose (db + api + web).

---

# 1) Lược đồ dữ liệu (SQL phác thảo)

```sql
-- USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY,
  nickname      VARCHAR(50) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- GAMES
CREATE TYPE game_state AS ENUM ('PLAYING','COMPLETED','ERROR');
CREATE TABLE games (
  id            UUID PRIMARY KEY,
  code          CHAR(6) UNIQUE NOT NULL,          -- để mời/join
  user_id       UUID NOT NULL REFERENCES users(id),-- creator
  game_state    game_state NOT NULL DEFAULT 'PLAYING',
  board_size    INT NOT NULL,                     -- 4/6/8
  puzzle_json   JSONB NOT NULL,                   -- đề puzzle (ô gợi ý)
  solution_json JSONB NOT NULL,                   -- nghiệm chuẩn (ẩn với client bình thường)
  current_json  JSONB NOT NULL,                   -- trạng thái hiện tại
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Người tham gia (1 hoặc 2 người)
CREATE TABLE game_participants (
  id            UUID PRIMARY KEY,
  game_id       UUID NOT NULL REFERENCES games(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  role          VARCHAR(10) NOT NULL DEFAULT 'player', -- 'host'/'guest'
  joined_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, user_id)
);

-- Lời mời
CREATE TABLE game_invitations (
  id            UUID PRIMARY KEY,
  game_id       UUID NOT NULL REFERENCES games(id),
  inviter_id    UUID NOT NULL REFERENCES users(id),
  invited_user_id UUID,                             -- null nếu join qua code
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

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

**Index nên có**: `games(code)`, `game_participants(game_id)`, `game_moves(game_id, created_at)`.

---

# 2) LocalStorage & danh tính ẩn danh

* Khi mở app lần đầu:

  * Nếu **không có** `localStorage.user_id`: sinh `UUID v4` → lưu `user_id`.
  * Tạo `nickname` ngẫu nhiên (`Fox123`, `Tiger7`…) → lưu `nickname`.
  * `POST /users.sync` để **đồng bộ lên server** (upsert).
* **Khoá LS dùng**:

  * `rumba_user_id`, `rumba_nickname`.

---

# 3) API contract (REST ngắn gọn)

### 3.1 Users

* `POST /users.sync`

  * body: `{ "user_id": "uuid", "nickname": "string" }`
  * upsert user.
  * resp: `200 { user: {...} }`

### 3.2 Games

* `POST /games`

  * header: `x-user-id: <uuid>`
  * body: `{ "board_size": 6 }`
  * server:

    * sinh `code` 6 ký tự `[A-Z0-9]`, unique.
    * generate **puzzle** + **solution** (từ code MVP sẵn).
    * set `current_json = puzzle_json`.
    * tạo `game` + `game_participants (host)`.
  * resp: `201 { game: {id, code, game_state, board_size, puzzle_json, current_json} }`

* `GET /games/:code`

  * trả về thông tin game (ẩn `solution_json` trừ khi host/debug).
  * nếu chưa tham gia, chỉ xem chế độ “spectate” (tuỳ chọn).

* `POST /games/:code/join`

  * header: `x-user-id`
  * tạo `game_participants` cho user thứ 2 (nếu còn slot).
  * resp: `{ game, participants }`

* `POST /games/:id/move`

  * header: `x-user-id`
  * body: `{ r, c, value }` where `value ∈ ['X','O',' ']`
  * server:

    * xác thực: ô không phải **clue** cố định.
    * update `current_json[r][c] = value`.
    * kiểm tra hợp lệ cục bộ (no-3, ≤ N/2 mỗi dòng/cột; có thể hoãn `unique-row/col` nếu muốn cho phép trạng thái trung gian).
    * nếu hoàn tất & hợp lệ → `game_state = COMPLETED`.
    * ghi `game_moves`.
    * broadcast WS event `game:update`.
  * resp: `{ current_json, game_state, errors?: [] }`

* `POST /games/:id/invite`

  * header: `x-user-id`
  * server: tạo record `game_invitations` (optional `invited_user_id`).
  * resp: `{ code }` (client copy/share link `/join?code=ABC123`).

---

# 4) Realtime (WebSocket) — kênh & sự kiện

**Kênh:** `/ws` (một namespace); **room** theo `game_id`.

**Handshake:** client gửi `{ type: 'auth', user_id }` → server xác nhận.

**Sự kiện phía server phát (emit):**

* `game:update`

  ```json
  {
    "type": "game:update",
    "game_id": "uuid",
    "current_json": [[ "", "X", ... ]],
    "game_state": "PLAYING",
    "stats": {
      "user_empty_cells": { "host": 7, "guest": 9 }  // xem §6
    }
  }
  ```
* `game:joined` (khi user2 join).
* `game:completed` (khi hoàn thành).
* `presence:update` (tuỳ chọn: ai online).

**Sự kiện phía client gửi:**

* `join:room` → `{ game_id }`
* `move:apply` → `{ game_id, r, c, value }`  (server sẽ ủy quyền sang REST `POST /games/:id/move` hoặc xử lý trực tiếp rồi persist)
* `progress:report` → `{ game_id, empty_count }` (để hiển thị “số ô còn trống của đối thủ”)

> Gợi ý triển khai: Xử lý **move** qua REST để có transaction/validation rõ ràng; WS chỉ dùng để **broadcast**.

---

# 5) Luồng màn hình & UX (1–2 người)

### 5.1 Home

* Kiểm tra LocalStorage → `users.sync`.
* Nút **New Game** → gọi `POST /games` → chuyển tới màn hình Game.
* Nút **Join Game** → mở modal nhập `code` → `POST /games/:code/join` → vào Game.

### 5.2 Màn hình Game (user1 – host)

* Hiển thị board (đề + ô có thể bấm).
* Nút **Invite to play** → mở modal hiển thị `code` + link copy `/join?code=ABC123`.
* Thanh phụ: hiển thị **“Ô trống của đối thủ: N”** (xem §6).
* Khi click ô: gửi `POST /games/:id/move`, sau đó nhận **WS `game:update`** để đồng bộ.
* Badge trạng thái: `PLAYING/COMPLETED/ERROR`.

### 5.3 Màn hình Join (user2 – guest)

* Nút **Join game** → modal nhập `code` → `POST /games/:code/join` → vào Game.
* Cùng UI board; hiển thị **“Ô trống của đối thủ”** (đọc từ WS).

---

# 6) “Ô trống của đối thủ” (đo lường & phát realtime)

* **Trên client** mỗi khi local state thay đổi (sau khi nhận `game:update` hoặc người chơi thao tác),

  * tính `empty_count = tổng số ô == EMPTY`.
  * emit WS `progress:report` → `{ game_id, empty_count }`.
* **Server** nhận event và:

  * lưu tạm **per-user** vào memory cache/Redis: `progress:{game_id}:{user_id} = empty_count`.
  * gộp thành:

    ```json
    {
      "user_empty_cells": { "host": 7, "guest": 9 }
    }
    ```
  * emit `game:update` cho room (cùng với `current_json` khi có thay đổi).

---

# 7) Sinh code & kiểm tra

* **Code 6 ký tự**: `[A-Z0-9]{6}`, sinh cho đến khi unique (check DB unique index).
* **Validation move**:

  * Từ `initial puzzle`: chặn sửa ô cố định.
  * Áp ràng buộc cục bộ: *no-three*, *≤ N/2 mỗi hàng/cột*. (Kiểm tra uniqueness hàng/cột có thể trì hoãn đến gần-complete để UX mượt hơn.)
* **Hoàn thành**:

  * Khi không còn EMPTY **và** board hợp lệ theo 3 luật → `game_state = COMPLETED`.

---

# 8) Bảo mật & giới hạn

* Không yêu cầu login, nhưng **mọi request** cần `x-user-id` (UUID từ LocalStorage).
* **Rate limit**: 30 req/10s cho `/games/:id/move`.
* **Room auth**: chỉ cho phép join WS room nếu user là participant của game hoặc game ở chế độ “spectate” (tuỳ chọn).
* Ẩn `solution_json` với client thường; chỉ server dùng cho **Check/Hint** (nếu bật).
* **Input sanitation**: r, c trong \[0..N-1], value thuộc `['X','O',' ']`.

---

# 9) Mốc triển khai (Claude Code checklist)

1. **Khởi tạo repo**: api + web + docker-compose (db).
2. **Tạo DB & Prisma/Eloquent models** theo schema trên; migration.
3. **Users**: `POST /users.sync`.
4. **Games**:

   * `POST /games` (generator từ code MVP hiện có → build `puzzle_json`, `solution_json`, `current_json`).
   * `GET /games/:code`
   * `POST /games/:code/join`
   * `POST /games/:id/move` (validation + update + emit WS).
5. **WebSocket server**: namespace `/ws`, room theo `game_id`, emit/receive events §4.
6. **Client**:

   * LocalStorage danh tính; gọi `/users.sync`.
   * Màn hình **New Game** / **Join Game** + modal nhập code.
   * Board UI: gọi `/move`, lắng nghe `game:update`.
   * Hiển thị **ô trống đối thủ** (nhận từ WS).
7. **Edge cases**:

   * Code không tồn tại / game đủ 2 người / game completed → hiển thị thông báo.
   * Khôi phục phiên: reload → `GET /games/:code` + join WS room.
8. **Test**: 2 trình duyệt/2 tab → join cùng code, chơi và xem “ô trống đối thủ” cập nhật tức thời.
9. **Hardening**: rate-limit, CORS, ẩn solution, log/audit moves.

---

# 10) Ví dụ payload

**POST /games (host)**

```http
POST /games
x-user-id: 2a2f…-uuid

{ "board_size": 6 }
```

**Resp**

```json
{
  "game": {
    "id": "e7c…",
    "code": "K9ZT2A",
    "game_state": "PLAYING",
    "board_size": 6,
    "puzzle_json": [["","X","","O",...], ...],
    "current_json": [["","X","","O",...], ...]
  }
}
```

**POST /games/K9ZT2A/join (guest)**

```http
x-user-id: 91b…-uuid
```

**Resp**

```json
{ "game": { "id": "e7c…", "code": "K9ZT2A", ... }, "participants": [ ... ] }
```

**POST /games/e7c…/move**

```http
x-user-id: 91b…-uuid
{ "r": 2, "c": 3, "value": "X" }
```

**Resp**

```json
{
  "current_json": [...],
  "game_state": "PLAYING"
}
```

**WS `game:update`**

```json
{
  "type": "game:update",
  "game_id": "e7c…",
  "current_json": [...],
  "game_state": "PLAYING",
  "stats": { "user_empty_cells": { "host": 7, "guest": 9 } }
}
```

---

# 11) Gợi ý mở rộng nhanh

* **Hint** server-side: áp dụng “forced moves” rồi trả về các ô chắc chắn.
* **Spectator mode**: nhiều người xem, chỉ phát `current_json` (ẩn solution).
* **Matchmaking**: lobby tìm đối thủ ngẫu nhiên.
* **Analytics**: thời gian hoàn thành, số nước đi, heatmap ô sai.

> Bạn chỉ cần copy block này vào Claude Code, lần lượt implement theo **mục 9 (checklist)** là ra sản phẩm MVP hoàn chỉnh (server + client + realtime + 2 người chơi + hiển thị “ô trống của đối thủ”).
