# 📜 Vehicle Branch Geofence PWA Constitution

## Article I — Purpose
This project exists to provide a lightweight Progressive Web App (PWA) that enables:
- branch registration
- geofence-based entry/exit detection
- manual recovery of missed events
- local data persistence
- operational reporting and communication

The system must remain simple, low-cost, and fully functional without a backend.

## Article II — Core Product Principles
### 2.1 Core Workflow Focus
- branch registration and prioritization
- geolocation-based detection (entry/exit)
- manual event registration
- local persistence
- report generation
- WhatsApp communication

### 2.2 MVP Scope
- installable PWA
- geolocation tracking while active
- configurable geofence
- entry/exit detection
- manual event registration
- local storage (IndexedDB preferred)
- report generation (text + PDF)
- WhatsApp prefilled messaging

### 2.3 Simplicity First
- avoid unnecessary abstractions
- vanilla JS baseline
- maintainable by a single developer

## Article III — Technical Constraints
### 3.1 Frontend-Only
- HTML, CSS, Vanilla JS
- IndexedDB / localStorage
- PWA (manifest + service worker)

### 3.2 Offline Capability
Core features must work offline.

### 3.3 Local Storage
IndexedDB preferred.

### 3.4 PWA Limitations
- no guaranteed background tracking
- depends on app being active

## Article IV — Geolocation Rules
- permission-based
- handle GPS inaccuracies
- configurable entry/exit radius
- hysteresis required
- Haversine formula

## Article V — Branch Management
- name, coordinates, priority
- alphabetical + priority sorting

## Article VI — Event Management
- ENTRY / EXIT
- automatic + manual
- include observations
- include duration

## Article VII — WhatsApp Messaging
- prefilled only
- Spanish required
- preview + copy mandatory
- optional direct send to predefined contact

## Article VIII — Reporting
- weekly / 3 days / 7 days / custom
- grouped by date
- format: branch | HH:mm - HH:mm
- include observations
- include total time

PDF:
- header
- graphs (configurable)
- tables grouped by date

Graphs:
- time by branch (Top + Others)
- time by day

## Article IX — UX Principles
- minimal steps
- clear state
- manual recovery
- no silent errors

## Article X — Delivery Principles
- spec before code
- incremental delivery

## Article XI — Quality
- deterministic logic
- real-world testing

## Article XII — Security
- explicit consent
- minimal data

## Article XIII — Success
- detect entry/exit
- manual recovery
- reports
- WhatsApp messages
- PDF export
- no backend required

## Article XIV — Non-Goals
- background tracking guarantee
- native app features
- automatic WhatsApp sending
- cloud sync
