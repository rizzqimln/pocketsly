# 🎓 Rencana Pembelajaran Sistem Informasi & Kurikulum Pocketsly

**Mahasiswa:** Sistem Informasi (Semester 1+)  
**Project Utama:** Pocketsly (Daily Rhythm) — Full-Stack Web Application (Pure Tech Stack)  
**Tujuan Utama:** Menguasai Rekayasa Perangkat Lunak & Sistem Informasi dari First-Principles (Anti "Vibe Coder"), relevan dengan mata kuliah perkuliahan dan kebutuhan industri.

---

## 📌 Semester 1: Fondasi Software Engineering & Sistem Informasi

### 1. Pemrograman Dasar
- **Materi Kuliah:** Tipe data, kontrol alur (if/else, loops), fungsi, modul, manipulasi string & array, penanganan error (try/except).
- **Implementasi di Pocketsly:**
  - **Python Backend (`server.py`, `auth.py`):** Penggunaan `http.server` murni, parsing URL query, penanganan exception HTTP, manipulasi string & bytes (`hashlib`).
  - **JavaScript Frontend (`app.js`, `api.js`):** ES6+ Async/Await, Fetch API, DOM manipulation, Array methods (`filter`, `map`, `reduce`), Event Handling.
- **Milestone Praktik:**
  - Menambah validasi input server-side & client-side pada form registered/task.
  - Memahami alur eksekusi asynchronous di JavaScript event loop.

### 2. Konsep Basis Data
- **Materi Kuliah:** ERD (Entity Relationship Diagram), Relational Model, DDL (Data Definition Language), DML (Data Manipulation Language), Normalisasi (1NF - 3NF), Primary & Foreign Keys.
- **Implementasi di Pocketsly:**
  - **Schema SQLite (`schema.sql`):** Tabel `users`, `habits`, `habit_logs`, `tasks`, `events`, `notes`.
  - **Integritas Referensial:** `FOREIGN KEY ... ON DELETE CASCADE`.
  - **Keamanan & Performa (`db.py`):** Parameterized SQL Queries (`?`) untuk mencegah SQL Injection, serta pengindeksan (`CREATE INDEX`).
- **Milestone Praktik:**
  - Menggambar ERD lengkap untuk aplikasi Pocketsly.
  - Menulis query SQL gabungan (`JOIN`) untuk agregasi laporan statistik kebiasaan harian.

### 3. Konsep Sistem Informasi
- **Materi Kuliah:** System Development Life Cycle (SDLC), Arsitektur Client-Server, Keamanan Sistem Informasi, Autentikasi & Otorisasi, Data Flow Diagram (DFD).
- **Implementasi di Pocketsly:**
  - **Arsitektur REST API:** Pemetaan verb `GET`, `POST`, `PATCH`, `DELETE` dan HTTP status code (`200`, `201`, `400`, `401`, `404`).
  - **Security & Authentication (`auth.py`):** Password Hashing dengan PBKDF2-HMAC-SHA256 (100k iterasi), Session Management via `HttpOnly` Cookies.
- **Milestone Praktik:**
  - Memeta arus data autentikasi dari client browser -> HTTP Cookie -> Python Server -> SQLite DB.

### 4. UI/UX Design
- **Materi Kuliah:** Visual Hierarchy, Layout Grid, Color Theory & Contrast, Usability Testing, Micro-interactions, Accessibility (WCAG).
- **Implementasi di Pocketsly:**
  - **Design System (`style.css`):** CSS Custom Properties (Tokens) untuk Light/Dark Theme, 8px Grid System, CSS Grid & Flexbox.
  - **Interactive UX (`ui.js`):** Toast Notifications, Accessible Modal Dialogs, Empty State Handling, Affordance (Hover/Focus state).
- **Milestone Praktik:**
  - Mengaudit kontras warna dan kegunaan antarmuka di Light/Dark mode.

---

## 🚀 Roadmap Semester 2 - 4 (Progresif)

| Semester | Fokus Akademik | Target Pengembangan Pocketsly |
| :--- | :--- | :--- |
| **Semester 2** | Pemrograman Berbasis Objek (OOP) & Struktur Data | Refactoring backend menggunakan class-based controllers & data structures (Queue/Stack untuk task priority). |
| **Semester 3** | Pemrograman Web Lanjut & Analisis Sistem (APSI) | Migrasi/Eksperimen ke Framework (FastAPI/Express) & ORM, dokumentasi UML (Use Case, Sequence Diagram). |
| **Semester 4** | Manajemen Basis Data Lanjut & DevOps Fundamentals | Dockerization, CI/CD pipeline, migrasi SQLite ke PostgreSQL, Automated Testing (Unit & E2E). |

---

## 🛡️ Prinsip Belajar "Anti Vibe-Coder"
1. **Pahami Setiap Baris Kode:** Jangan pernah salin-tempel kode tanpa memahami alasan teknis di baliknya.
2. **Ketik & Eksekusi:** Selalu uji kode secara langsung melalui unit test (`tests/test_api.py`) atau terminal execution.
3. **Dokumentasikan Pembelajaran:** Catat *pitfall*, *error handling*, dan alasan arsitektur di dalam catatan/commit log.
