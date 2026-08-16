# Pocketsly Mobile (Flutter / Dart) 📱

A cross-platform native mobile application for **Pocketsly**, built with **Flutter (Dart)** and connected 24/7 to your serverless **Cloudflare Pages + Cloudflare D1 Edge API**.

---

## Features & UI/UX Parity
- **1-to-1 Web Design System**: Dark glassmorphic theme (`#0B0F19` background, `#7C3AED` violet, `#10B981` emerald, `#EF4444` coral red).
- **24/7 Always-On Backend**: Directly communicates with `https://pocketsly.pages.dev/api` with zero cold starts, zero downtime, and persistent sessions.
- **Snappy Monthly Budget Planner**: Bottom sheet entry modal with currency formatting and 1-tap quick increment chips (`+10k`, `+25k`, `+50k`, `+100k`).
- **Interactive Habit Matrix & Todo**: 7-day routine tracker with instant toggle and priority badge tasks.
- **Timetable & Lecture Schedule**: Interactive day pill filtering (Monday–Sunday) with room/lecturer details.
- **Notes & Academic CS Library**: Markdown journal workspace and academic resource catalog.
- **Live SQL Sandbox & Labs**: Direct query execution against your Cloudflare D1 edge database.

---

## Directory Layout
```
mobile/
├── pubspec.yaml                 # Flutter packages & dependencies
├── package.json                 # Bun / NPM script runner definitions
└── lib/
    ├── main.dart                # App entrypoint, Theme & Shell Scaffold
    ├── core/
    │   ├── theme/               # AppColors (Pocketsly palette) & AppTheme
    │   ├── network/             # ApiEndpoints (24/7 Cloudflare Base URL) & ApiClient
    │   └── models/              # Models (Tasks, Habits, Schedules, Notes, Budgets)
    ├── widgets/                 # Reusable GlassCard, KpiCard, CurrencyField, BottomNavBar
    └── views/
        ├── dashboard/           # Daily overview & KPI stat row
        ├── habits/              # Habit streaks & Todo task list
        ├── schedule/            # Timetable grid with day selector
        ├── notes/               # Journal & Academic reference library
        ├── curriculum/          # CS Hub & Live SQL D1 Sandbox
        └── budget/              # Cashflow balance, targets & BudgetEntrySheet
```

---

## Quick Start

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Run the App (Desktop / Mobile / Web)
```bash
# Run directly on your Linux desktop (instant preview!)
bun run dev:linux
# or: flutter run -d linux

# Run on connected Android device / emulator
bun run dev:android
# or: flutter run -d android

# Run on Chrome / Web
bun run dev:web
# or: flutter run -d chrome
```

### 3. Build Production APK for Android
```bash
# Build release APK
bun run build:apk
# or: flutter build apk --release

# The installable APK is located at:
# build/app/outputs/flutter-apk/app-release.apk
```
