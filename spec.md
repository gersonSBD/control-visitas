# 📄 spec.md — Vehicle Branch Geofence PWA

## 1. Overview

### 1.1 Product Name
Vehicle Branch Geofence PWA

### 1.2 Goal
Enable users to automatically and manually track visits to physical branches using geolocation (geofencing), with offline-first behavior, local persistence, reporting, and export capabilities (WhatsApp, PDF, JSON).

### 1.3 Scope
- Progressive Web App (PWA)
- Offline-first architecture
- Single-user usage
- No backend required
- Local storage via IndexedDB
- Initial configuration requires user name and vehicle plate

---

## 2. Core Principles

1. Offline-first operation
2. User-owned data (no external dependency)
3. Transparent event handling (no silent corrections)
4. GPS error tolerance
5. Fast interaction (minimal steps)
6. Simple export mechanisms (PDF, WhatsApp, JSON)

---

## 3. Modules

1. Settings
2. Branch Management
3. Tracking (Geolocation)
4. Events & Visits
5. Visit History
6. Reports
7. Export (PDF / JSON)
8. WhatsApp Preview

---

## 4. Data Model

### 4.1 Branch
```ts
Branch {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  priority: number;
  entryRadiusMeters: number; // default: 80
  exitRadiusMeters: number;  // default: 110
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 VisitEvent
```ts
VisitEvent {
  id: string;
  branchId: string;
  branchNameSnapshot: string;
  type: 'ENTRY' | 'EXIT';
  timestamp: string;
  source: 'AUTO' | 'MANUAL';
  observation?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  pairedVisitId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 VisitSession
```ts
VisitSession {
  id: string;
  branchId: string;
  branchNameSnapshot: string;
  entryEventId?: string;
  exitEventId?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: 'OPEN' | 'CLOSED' | 'INCONSISTENT';
  sourceSummary: 'AUTO' | 'MANUAL' | 'MIXED';
  observations: string[];
  dateKey: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 AppSettings
```ts
AppSettings {
  geolocationWatchEnabled: boolean;
  defaultEntryRadiusMeters: 80;
  defaultExitRadiusMeters: 110;
  minAccuracyMeters: number;
  pollingIntervalMs: 15000;
  stabilityReadsRequired: 2;
  userName: string;
  vehiclePlate: string;
  contactPhone?: string;
  reportDefaultRange: '3_DAYS' | '7_DAYS' | 'WEEK' | 'CUSTOM';
  pdfIncludeGraphs: boolean;
  pdfIncludeVisitTable: boolean;
}
```

---

## 5. Geofence Rules

- Entry radius: 80m
- Exit radius: 110m
- Polling interval: 15 seconds
- Stability: 2 consecutive readings

---

## 6. MVP Acceptance Criteria

1. Branch CRUD works
2. Geofence detection works
3. Manual events work
4. Data persists locally
5. Initial configuration requires user name and vehicle plate
6. Reports include user name and vehicle plate in PDF output
7. WhatsApp report message includes user name and vehicle plate
8. Reports are generated
9. WhatsApp message is generated
10. PDF is generated
11. JSON export works
12. App works offline

---

## 7. Status

Version: 1.0  
State: READY FOR IMPLEMENTATION  
Approach: Spec-Driven Development
