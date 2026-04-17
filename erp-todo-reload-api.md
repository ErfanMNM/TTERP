# ERP ToDo - Reload List API Analysis

**URL:** https://erp.mte.vn/desk/todo
**User:** Administrator
**Date:** 2026-04-17

---

## Khi nhấn nút "Reload List", hệ thống gọi các API sau:

### 1. `GET /api/method/frappe.desk.reportview.get_count`

- **URL:** `https://erp.mte.vn/api/method/frappe.desk.reportview.get_count?doctype=ToDo&filters=%5B%5D&fields=%5B%5D&distinct=false&limit=1001`
- **Method:** `GET`
- **Headers:**
  - `x-frappe-csrf-token: 5c028191c896379b8d6e7c1a8c7435f8bbadd9f5c9aa689de22c40f7`
  - `x-frappe-doctype: ToDo`
  - `x-requested-with: XMLHttpRequest`
  - `referer: https://erp.mte.vn/desk/todo`
- **Response:**
  ```json
  {"message": 2}
  ```
- **Purpose:** Đếm tổng số bản ghi ToDo, trả về `2` (2 bản ghi)

---

### 2. `POST /api/method/frappe.desk.reportview.get`

- **URL:** `https://erp.mte.vn/api/method/frappe.desk.reportview.get`
- **Method:** `POST`
- **Headers:**
  - `x-frappe-csrf-token: 5c028191c896379b8d6e7c1a8c7435f8bbadd9f5c9aa689de22c40f7`
  - `x-frappe-doctype: ToDo`
  - `x-requested-with: XMLHttpRequest`
  - `content-type: application/x-www-form-urlencoded`
  - `referer: https://erp.mte.vn/desk/todo`
- **Request Body (decoded):**
  ```
  doctype=ToDo
  fields=[
    "tabToDo.name",
    "tabToDo.owner",
    "tabToDo.creation",
    "tabToDo.modified",
    "tabToDo.modified_by",
    "tabToDo._user_tags",
    "tabToDo._comments",
    "tabToDo._assign",
    "tabToDo._liked_by",
    "tabToDo.docstatus",
    "tabToDo.idx",
    "tabToDo.status",
    "tabToDo.priority",
    "tabToDo.date",
    "tabToDo.reference_type",
    "tabToDo.description",
    "tabToDo.reference_name",
    "tabToDo._seen",
    "tabToDo.color"
  ]
  filters=[]
  order_by=`tabToDo`.`creation` desc
  start=0
  page_length=20
  view=List
  group_by=
  with_comment_count=1
  ```
- **Response Body:**
  ```json
  {
    "message": {
      "keys": [
        "name","owner","creation","modified","modified_by",
        "_user_tags","_comments","_assign","_liked_by",
        "docstatus","idx","status","priority","date",
        "reference_type","description","reference_name","_seen","color","_comment_count"
      ],
      "values": [
        [
          "4n3i69loef",
          "Administrator",
          "2026-04-14 16:53:52.368365",
          "2026-04-14 16:56:29.036968",
          "okeynhat@gmail.com",
          null,
          "[{\"comment\": \"<div class=\\\"ql-editor read-mode\\\"><p>Đã hoàn thành</p></div>\", \"by\": \"okeynhat@gmail.com\", \"name\": \"608j9onuia\"}]",
          null,
          null,
          0,
          0,
          "Closed",
          "High",
          "2026-04-14",
          "Task",
          "<div class=\"ql-editor read-mode\"><p>Xây dựng cơ cấu dự án</p></div>",
          "TASK-2026-00111",
          "[\"okeynhat@gmail.com\", \"Administrator\"]",
          "#39E4A5",
          1
        ],
        [
          "1m5ouvghu3",
          "Administrator",
          "2026-04-13 17:08:45.355776",
          "2026-04-13 17:15:40.039542",
          "Administrator",
          null,
          null,
          null,
          null,
          0,
          0,
          "Closed",
          "Medium",
          "2026-04-09",
          "Item",
          "<div class=\"ql-editor read-mode\"><p>Van 2 đầu cho máy VIDEOJET: P/N 206429</p></div>",
          "206429",
          "[\"Administrator\"]",
          null,
          0
        ]
      ],
      "user_info": {}
    }
  }
  ```
- **Purpose:** Lấy chi tiết 2 bản ghi ToDo, sắp xếp theo `creation` giảm dần (mới nhất trước)

---

## Tóm tắt luồng Reload List

| Bước | API | Method | Mục đích |
|------|-----|--------|----------|
| 1 | `frappe.desk.reportview.get_count` | GET | Đếm tổng số bản ghi → trả về `2 of 2` |
| 2 | `frappe.desk.reportview.get` | POST | Lấy danh sách chi tiết 2 bản ghi ToDo |

## Các trường dữ liệu ToDo được lấy về

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `name` | string | ID của bản ghi |
| `owner` | string | Người tạo |
| `creation` | datetime | Thời gian tạo |
| `modified` | datetime | Thời gian sửa cuối |
| `modified_by` | string | Người sửa cuối |
| `_user_tags` | string | Tags |
| `_comments` | string | Comments (JSON) |
| `_assign` | string | Người được assign (JSON) |
| `_liked_by` | string | Người like (JSON) |
| `docstatus` | int | Trạng thái document |
| `idx` | int | Index |
| `status` | string | Trạng thái (Open/Closed/Cancelled) |
| `priority` | string | Độ ưu tiên (High/Medium/Low) |
| `date` | date | Ngày đến hạn |
| `reference_type` | string | Loại reference (Task, Item...) |
| `description` | string | Mô tả (HTML) |
| `reference_name` | string | Tên reference |
| `_seen` | string | Đã xem chưa (JSON) |
| `color` | string | Màu sắc |
| `_comment_count` | int | Số comment |

## 2 bản ghi ToDo hiện có

### Record 1: `4n3i69loef`
- **Mô tả:** Xây dựng cơ cấu dự án
- **Status:** Closed
- **Priority:** High
- **Due Date:** 2026-04-14
- **Reference:** Task → TASK-2026-00111
- **Người sở hữu:** Administrator
- **Comment:** "Đã hoàn thành" bởi okeynhat@gmail.com
- **Số comment:** 1

### Record 2: `1m5ouvghu3`
- **Mô tả:** Van 2 đầu cho máy VIDEOJET: P/N 206429
- **Status:** Closed
- **Priority:** Medium
- **Due Date:** 2026-04-09
- **Reference:** Item → 206429
- **Người sở hữu:** Administrator
- **Số comment:** 0
