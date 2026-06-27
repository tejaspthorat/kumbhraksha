# Phase 3: Map + Dashboard (Week 3)

**Goal**: Implement proactive sighting reports, active alerts map, authority dashboard, and family pre-registration.

**Duration**: 7 days (Days 15-21)

---

## Key Features

### Feature 1: Report Sighting Screen
- **Objective**: Citizen reports someone who looks lost (proactive)
- **Tasks**:
  - [ ] Sighting form UI (photo, age, gender, behavior)
  - [ ] Quick person type selector (child, adult, elderly)
  - [ ] Behavior emoji buttons (crying, confused, wandering)
  - [ ] Location auto-detection
  - [ ] Notes field
  - [ ] Submission with photo upload
  - [ ] Optional: "I'll guide to help" (live location sharing)

---

### Feature 2: Active Alerts Map
- **Objective**: Display cases & sightings on map
- **Tasks**:
  - [ ] Google Maps setup
  - [ ] Missing person markers (red)
  - [ ] Sighting markers (yellow)
  - [ ] Pulsing rings animation (cascading radius)
  - [ ] Layer toggles (missing, sightings, CCTV, density)
  - [ ] Marker tap → detail card (bottom sheet)
  - [ ] Zoom & pan
  - [ ] User location (blue dot)

---

### Feature 3: Authority Dashboard (React)
- **Objective**: Web dashboard for police/authorities
- **Scope**: MVP only
- **Tasks**:
  - [ ] Officer login & auth
  - [ ] Live operations map
  - [ ] Case management table
  - [ ] Case detail panel (witnesses, sightings)
  - [ ] Alert controls (radius, manual broadcast)
  - [ ] WebSocket live updates

---

### Feature 4: Family Group Management
- **Objective**: Pre-register family members for quick reporting
- **Tasks**:
  - [ ] Family group screen
  - [ ] Add family member form
  - [ ] Photo + clothing pre-fill
  - [ ] Edit/delete members
  - [ ] Quick report from family (pre-filled form)
  - [ ] Optional: Live location sharing toggle

---

### Feature 5: Attribute Matching Engine
- **Objective**: Match sightings to missing reports (backend)
- **Tasks**:
  - [ ] Clothing & description matching algorithm
  - [ ] Confidence scoring (0-1)
  - [ ] Witness feedback refinement
  - [ ] Match broadcast to dashboard

---

## File Structure

```
lib/features/
├── map/
│   ├── presentation/
│   │   ├── screens/
│   │   │   └── active_alerts_map_screen.dart
│   │   ├── widgets/
│   │   │   ├── map_marker_widget.dart
│   │   │   └── detail_sheet.dart
│   │   └── providers/
│   │       └── map_provider.dart
│   └── ...
├── sightings/
│   ├── presentation/
│   │   ├── screens/
│   │   │   └── report_sighting_screen.dart
│   │   └── ...
│   └── ...
└── family/
    ├── presentation/
    │   ├── screens/
    │   │   └── family_group_screen.dart
    │   ├── widgets/
    │   │   └── family_member_card.dart
    │   └── ...
    └── ...

dashboard/
└── src/
    ├── components/
    ├── pages/
    ├── services/
    └── ...
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Map performance | <200ms load, 60 FPS pan/zoom |
| Sighting submission | <5s from capture to backend |
| Dashboard case load | 100+ cases displayed |
| Family member limit | 10 members per group |
| Match confidence accuracy | >80% for test cases |

---

## Completion Checklist

- [ ] Sighting form captures all required data
- [ ] Photo upload works for sightings
- [ ] Active alerts map renders correctly
- [ ] Map markers animate (pulsing rings)
- [ ] Layer toggles work
- [ ] Dashboard loads cases & displays list
- [ ] Case detail panel shows witnesses & sightings
- [ ] Authority can manually broadcast alerts
- [ ] Family members pre-fill report form
- [ ] Quick report from family member works
- [ ] Attribute matching returns results
- [ ] WebSocket pushes updates to dashboard
- [ ] All tests passing

---

**Last Updated**: 2026-06-27
