# Flutter Material Design 3 Theme Specification

## Color System

### Primary Color Palette
```
Primary (Emergency/Alert Color):
  - Color: #EF4444 (Red)
  - Rationale: Signals urgency for missing person alerts
  - Light: #FEE2E2
  - Dark: #7F1D1D

Secondary (Action/CTA):
  - Color: #3B82F6 (Blue)
  - Rationale: Trust and calm (authorities, actions)
  - Light: #DBEAFE
  - Dark: #1E3A8A

Tertiary (Success/Completion):
  - Color: #10B981 (Green)
  - Rationale: Positive outcomes (person found, report submitted)
  - Light: #D1FAE5
  - Dark: #064E3B

Error:
  - Color: #EF4444 (Red)
  - Container: #FFEBEE
  - On-Error: White

Background:
  - Color: #FFFFFF (Light) / #121212 (Dark)
  - Surface: #F3F4F6 (Light) / #1E1E1E (Dark)
  - Surface Dim: #EEEFF5 (Light) / #0F0F15 (Dark)

Outline:
  - Color: #9CA3AF (Medium Gray)
  - Variant: #D1D5DB (Light Gray)
  - Dark: #6B7280

Scrim/Shadow:
  - Color: #000000 (Always black, opacity-based)
```

### Usage Examples

```dart
// Material 3 Color Scheme
final lightColorScheme = ColorScheme.fromSeed(
  seedColor: Color(0xFFEF4444),  // Primary red
  brightness: Brightness.light,
  primary: Color(0xFFEF4444),
  secondary: Color(0xFF3B82F6),
  tertiary: Color(0xFF10B981),
  error: Color(0xFFEF4444),
  surface: Color(0xFFFAFAFA),
  onSurface: Color(0xFF1F2937),
);

final darkColorScheme = ColorScheme.fromSeed(
  seedColor: Color(0xFFEF4444),
  brightness: Brightness.dark,
  primary: Color(0xFFFF6B6B),
  secondary: Color(0xFF60A5FA),
  tertiary: Color(0xFF34D399),
  error: Color(0xFFFF6B6B),
  surface: Color(0xFF121212),
  onSurface: Color(0xFFF3F4F6),
);
```

---

## Typography System

### Font Family
- **Default**: Inter (Google Fonts)
- **Hindi/Regional**: Noto Sans (supports 11 languages)

### Text Scales (Material 3)

```dart
final textTheme = TextTheme(
  // Headings
  displayLarge: TextStyle(    // 57sp, w700
    fontSize: 57,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.0,
  ),
  displayMedium: TextStyle(   // 45sp, w700
    fontSize: 45,
    fontWeight: FontWeight.w700,
  ),
  displaySmall: TextStyle(    // 36sp, w700
    fontSize: 36,
    fontWeight: FontWeight.w700,
  ),
  
  // Headlines
  headlineLarge: TextStyle(   // 32sp, w700
    fontSize: 32,
    fontWeight: FontWeight.w700,
  ),
  headlineMedium: TextStyle(  // 28sp, w700
    fontSize: 28,
    fontWeight: FontWeight.w700,
  ),
  headlineSmall: TextStyle(   // 24sp, w700
    fontSize: 24,
    fontWeight: FontWeight.w700,
  ),
  
  // Titles
  titleLarge: TextStyle(      // 22sp, w700
    fontSize: 22,
    fontWeight: FontWeight.w700,
  ),
  titleMedium: TextStyle(     // 16sp, w600
    fontSize: 16,
    fontWeight: FontWeight.w600,
  ),
  titleSmall: TextStyle(      // 14sp, w600
    fontSize: 14,
    fontWeight: FontWeight.w600,
  ),
  
  // Body (most common)
  bodyLarge: TextStyle(       // 16sp, w400
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
  ),
  bodyMedium: TextStyle(      // 14sp, w400
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.43,
  ),
  bodySmall: TextStyle(       // 12sp, w400
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.33,
  ),
  
  // Labels
  labelLarge: TextStyle(      // 14sp, w600 (buttons)
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
  ),
  labelMedium: TextStyle(     // 12sp, w600 (tags)
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
  ),
  labelSmall: TextStyle(      // 11sp, w600
    fontSize: 11,
    fontWeight: FontWeight.w600,
  ),
);
```

### Usage in Screens

```dart
// Screen title
Text(
  'Alert Feed',
  style: Theme.of(context).textTheme.headlineLarge,
);

// Card title
Text(
  'Missing Person',
  style: Theme.of(context).textTheme.titleLarge,
);

// Body text
Text(
  'You were near them at 2:10 PM',
  style: Theme.of(context).textTheme.bodyMedium,
);

// Button label
Text(
  'I See Them',
  style: Theme.of(context).textTheme.labelLarge,
);
```

---

## Component Specifications

### Buttons

#### Filled Button (Primary CTA)
- **Background**: Primary color
- **Text**: On Primary color
- **Height**: 40dp (normal), 48dp (touch target minimum)
- **Padding**: 24dp horizontal
- **Corner Radius**: 8dp (medium)
- **Elevation**: None (flat)
- **State**: Disabled (opacity 38%)

```dart
FilledButton(
  onPressed: () {},
  style: FilledButton.styleFrom(
    backgroundColor: Theme.of(context).colorScheme.primary,
    minimumSize: Size(double.infinity, 48),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
    ),
  ),
  child: Text('Report Missing Person'),
);
```

#### Outlined Button (Secondary Action)
- **Border**: 1.5dp outline in Primary
- **Background**: Transparent
- **Text**: Primary color
- **Same height/padding as filled**

#### Text Button (Tertiary)
- **Background**: Transparent
- **Text**: Primary color
- **No border**

#### Icon Button (Compact)
- **Size**: 40dp (icon inside: 24dp)
- **Corner Radius**: 8dp or full circle (48dp)
- **Ripple**: Yes, confined

### Cards

#### Alert Card (Witness/Area)
```dart
Card(
  elevation: 1,  // Subtle shadow
  shape: RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(12),
  ),
  color: Theme.of(context).colorScheme.surface,
  child: Padding(
    padding: EdgeInsets.all(16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Card header with colored accent
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Text('WITNESS ALERT', style: TextStyle(color: Colors.white)),
        ),
        SizedBox(height: 12),
        // Card content
      ],
    ),
  ),
);
```

### Input Fields

#### Text Input
```dart
TextField(
  decoration: InputDecoration(
    labelText: 'Person Name',
    hintText: 'Enter full name',
    prefixIcon: Icon(Icons.person),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
    ),
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  ),
);
```

#### Dropdown
```dart
DropdownButtonFormField(
  decoration: InputDecoration(
    labelText: 'Gender',
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
    ),
  ),
  items: ['Male', 'Female', 'Other']
    .map((e) => DropdownMenuItem(value: e, child: Text(e)))
    .toList(),
);
```

### Dialog/Bottom Sheet

```dart
showModalBottomSheet(
  context: context,
  shape: RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
  ),
  builder: (context) => SafeArea(
    child: Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Confirm Sighting', style: headlineMedium),
          SizedBox(height: 16),
          // Content
        ],
      ),
    ),
  ),
);
```

### AppBar

```dart
AppBar(
  elevation: 0,  // Flat design
  backgroundColor: Theme.of(context).colorScheme.surface,
  foregroundColor: Theme.of(context).colorScheme.onSurface,
  title: Text('Alert Feed'),
  centerTitle: false,
  scrolledUnderElevation: 1,  // Elevation appears on scroll
);
```

### Bottom Navigation

```dart
BottomNavigationBar(
  items: [
    BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
    BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Map'),
    BottomNavigationBarItem(icon: Icon(Icons.add), label: 'Report'),
    BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
  ],
  currentIndex: _currentIndex,
  onTap: (index) => setState(() => _currentIndex = index),
  type: BottomNavigationBarType.fixed,
  backgroundColor: Theme.of(context).colorScheme.surface,
  selectedItemColor: Theme.of(context).colorScheme.primary,
  unselectedItemColor: Colors.grey[400],
);
```

---

## Spacing & Layout

### Standard Spacing Scale
```
4dp   (xs)
8dp   (sm)
12dp  (md)
16dp  (lg)
24dp  (xl)
32dp  (2xl)
48dp  (3xl)
```

### Safe Areas & Padding
- **Screen padding**: 16dp (all sides)
- **Card padding**: 16dp (all sides)
- **Content between items**: 12-16dp
- **Vertical spacing between sections**: 24dp

### Breakpoints (Responsive)
- **Compact**: <600dp (phones)
- **Medium**: 600-840dp (tablets, landscape)
- **Expanded**: >840dp (large tablets)

---

## Responsive Design

### Phone Layout (Compact, <600dp)
- Single column
- Full-width cards
- Bottom navigation bar

### Tablet Layout (Medium, 600-840dp)
- Two-column layout (list + detail)
- Drawer navigation
- Floating action buttons

### Landscape (All sizes)
- Adjust padding & spacing
- Hidden FABs, move to app bar
- Multi-column layouts where possible

---

## Dark Mode Support

```dart
// Material 3 automatically inverts colors in dark mode
// High contrast text:
// Light mode: dark text on light backgrounds
// Dark mode: light text on dark backgrounds

// Custom dark overrides:
final darkTheme = ThemeData.dark(useMaterial3: true).copyWith(
  colorScheme: darkColorScheme,
  textTheme: textTheme.apply(
    displayColor: Colors.white,
    bodyColor: Colors.white,
  ),
);
```

---

## Animations & Transitions

### Standard Durations
- **Quick**: 100ms (hover, focus states)
- **Standard**: 200ms (button press, icon change)
- **Slow**: 300-500ms (page transitions, modal enter)

### Easing Curves
- **Standard**: `Curves.easeInOut` (most common)
- **Emphasis In**: `Curves.easeOut` (entrance animations)
- **Emphasis Out**: `Curves.easeIn` (exit animations)
- **Decelerate**: `Curves.decelerate` (quick stop)

### Examples

```dart
// Page transition
PageRouteBuilder(
  transitionDuration: Duration(milliseconds: 300),
  pageBuilder: (_, __, ___) => NextPage(),
  transitionsBuilder: (_, animation, __, child) {
    return FadeTransition(opacity: animation, child: child);
  },
);

// Alert card slide-in
AnimatedSlide(
  offset: isVisible ? Offset.zero : Offset(0, 1),
  duration: Duration(milliseconds: 300),
  curve: Curves.easeOut,
  child: AlertCard(),
);

// Pulsing marker (map)
AnimatedOpacity(
  opacity: _pulseOpacity,
  duration: Duration(milliseconds: 1500),
  curve: Curves.easeInOut,
  child: Container(
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      border: Border.all(color: Colors.red, width: 2),
    ),
  ),
);
```

---

## Iconography

### Icon Styles
- **Style**: Material Symbols (Outlined by default)
- **Size**: 24dp (standard), 20dp (dense), 28dp (prominent)
- **Color**: Inherit from text color or use semantic colors

### Common Icons
- **🏠 Home**: `Icons.home`
- **🗺️ Map**: `Icons.map`
- **➕ Add**: `Icons.add`
- **👤 Profile**: `Icons.person`
- **🔔 Alert**: `Icons.notifications`
- **📍 Location**: `Icons.location_on`
- **📸 Camera**: `Icons.camera_alt`
- **⚙️ Settings**: `Icons.settings`
- **🔍 Search**: `Icons.search`
- **📱 Phone**: `Icons.phone`

---

## Accessibility Requirements

### Color Contrast
- **Text on background**: 4.5:1 (WCAG AA)
- **Large text**: 3:1
- **Icons**: Same as text

### Touch Targets
- **Minimum size**: 48dp x 48dp
- **Spacing**: 8dp gap between targets
- **Example**: Buttons, tabs, icon buttons

### Text & Readability
- **Min font size**: 12sp (bodySmall)
- **Line height**: 1.4-1.5x font size
- **Max line length**: 80-100 characters (readability)

### Focus & Semantics
- **Keyboard navigation**: All interactive elements focusable
- **Semantic labels**: `Semantics` widget with labels
- **Screen reader**: Test with TalkBack (Android) / VoiceOver (iOS)

```dart
// Example: Semantic label for icon button
Semantics(
  label: 'Open navigation menu',
  button: true,
  enabled: true,
  child: IconButton(
    icon: Icon(Icons.menu),
    onPressed: () => openDrawer(),
  ),
);
```

---

## Theme Implementation (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  google_fonts: ^6.0.0          # Font support
  material_color_utilities: ^0.8.0  # Material 3 colors
  dynamic_color: ^1.6.0         # Dynamic color (Android 12+)

dev_dependencies:
  build_runner: ^2.0.0
  flutter_gen_runner: ^5.0.0
```

---

## Files to Create

- `lib/core/theme/color_scheme.dart` — Color definitions
- `lib/core/theme/text_theme.dart` — Typography scales
- `lib/core/theme/app_theme.dart` — Complete theme setup
- `lib/core/constants/dimensions.dart` — Spacing & layout
- `lib/core/constants/durations.dart` — Animation timings

---

**Last Updated**: 2026-06-27  
**Version**: 1.0
