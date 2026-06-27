# System Design & Architecture

## Overview

KumbhRaksha follows a **layered clean architecture** with:
- **Data Layer**: Repositories, local DB, remote API
- **Domain Layer**: Models, business logic
- **Presentation Layer**: Screens, widgets, state management

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  Screens → Widgets → Riverpod Providers (UI State)             │
└────────────────────────┬────────────────────────────────────────┘
                         │ Listens/Updates
┌────────────────────────▼────────────────────────────────────────┐
│              DOMAIN LAYER (State & Business Logic)              │
│  Use Cases → Repositories → Models → Validators                │
└────────────────────────┬────────────────────────────────────────┘
                         │ Calls
┌────────────────────────▼────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │ Local DB     │  │ Remote API   │  │ Services       │        │
│  │ (SQLite)     │  │ (Express)    │  │ (BLE, GPS)     │        │
│  └──────────────┘  └──────────────┘  └────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure (Detailed)

```
lib/
├── main.dart
│
├── core/
│   ├── constants/
│   │   ├── api_constants.dart        # API endpoints, timeouts
│   │   ├── app_constants.dart        # App-wide constants
│   │   ├── dimensions.dart           # Spacing (8, 16, 24, etc)
│   │   ├── durations.dart            # Animation timings
│   │   └── ble_constants.dart        # BLE UUIDs, intervals
│   │
│   ├── theme/
│   │   ├── color_scheme.dart         # Material 3 colors
│   │   ├── text_theme.dart           # Typography scales
│   │   ├── app_theme.dart            # Complete theme (light/dark)
│   │   └── custom_colors.dart        # Custom color utilities
│   │
│   ├── extensions/
│   │   ├── context_ext.dart          # BuildContext extensions
│   │   ├── datetime_ext.dart         # DateTime helpers
│   │   ├── string_ext.dart           # String utilities
│   │   └── list_ext.dart             # List utilities
│   │
│   ├── utils/
│   │   ├── logger.dart               # Logging utility
│   │   ├── validators.dart           # Form validators
│   │   ├── formatters.dart           # Data formatters
│   │   ├── distance_calculator.dart  # RSSI → distance
│   │   └── error_handler.dart        # Error handling
│   │
│   └── exceptions/
│       ├── app_exception.dart        # Custom exceptions
│       └── error_codes.dart          # Error code enums
│
├── features/
│   ├── auth/                         # Onboarding & authentication
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── auth_remote_datasource.dart
│   │   │   │   └── auth_local_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── user_model.dart   # User + serialization
│   │   │   └── repositories/
│   │   │       └── auth_repository.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user_entity.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart (abstract)
│   │   │   └── usecases/
│   │   │       ├── register_usecase.dart
│   │   │       ├── verify_otp_usecase.dart
│   │   │       └── logout_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── auth_provider.dart     # Auth state
│   │       │   └── user_provider.dart     # Current user
│   │       ├── screens/
│   │       │   ├── onboarding_screen.dart
│   │       │   ├── language_selection_screen.dart
│   │       │   ├── phone_input_screen.dart
│   │       │   └── otp_verification_screen.dart
│   │       ├── widgets/
│   │       │   ├── permission_card.dart
│   │       │   └── language_selector.dart
│   │       └── state/
│   │           └── auth_state.dart  (Riverpod states)
│   │
│   ├── ble/                          # BLE scanning & advertising
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   └── ble_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── ble_encounter_model.dart
│   │   │   └── repositories/
│   │   │       └── ble_repository.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── ble_encounter_entity.dart
│   │   │   ├── repositories/
│   │   │   │   └── ble_repository.dart (abstract)
│   │   │   └── usecases/
│   │   │       ├── start_scanning_usecase.dart
│   │   │       ├── start_advertising_usecase.dart
│   │   │       └── get_encounters_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── ble_provider.dart
│   │       └── state/
│   │           └── ble_state.dart
│   │
│   ├── location/                     # GPS & location services
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   └── location_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── location_model.dart
│   │   │   └── repositories/
│   │   │       └── location_repository.dart
│   │   ├── domain/
│   │   │   └── ...
│   │   └── presentation/
│   │       └── ...
│   │
│   ├── report/                       # Missing person report
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── report_remote_datasource.dart
│   │   │   │   └── report_local_datasource.dart
│   │   │   ├── models/
│   │   │   │   ├── missing_report_model.dart
│   │   │   │   └── clothing_model.dart
│   │   │   └── repositories/
│   │   │       └── report_repository.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── missing_report_entity.dart
│   │   │   │   └── clothing_entity.dart
│   │   │   └── usecases/
│   │   │       ├── create_report_usecase.dart
│   │   │       └── get_report_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── report_form_provider.dart
│   │       ├── screens/
│   │       │   └── report_missing_screen.dart
│   │       ├── widgets/
│   │       │   ├── photo_picker_widget.dart
│   │       │   ├── clothing_selector_widget.dart
│   │       │   └── location_picker_widget.dart
│   │       └── state/
│   │           └── report_form_state.dart
│   │
│   ├── alerts/                       # Alert feed & notifications
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── alerts_remote_datasource.dart
│   │   │   │   ├── alerts_local_datasource.dart
│   │   │   │   └── websocket_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── witness_alert_model.dart
│   │   │   └── repositories/
│   │   │       └── alerts_repository.dart
│   │   ├── domain/
│   │   │   └── ...
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── alerts_feed_provider.dart
│   │       │   └── websocket_provider.dart
│   │       ├── screens/
│   │       │   ├── home_screen.dart
│   │       │   ├── confirm_sighting_screen.dart
│   │       │   └── witness_memory_screen.dart
│   │       ├── widgets/
│   │       │   ├── witness_alert_card.dart
│   │       │   ├── area_alert_card.dart
│   │       │   └── sighting_card.dart
│   │       └── state/
│   │           └── alerts_state.dart
│   │
│   ├── map/                          # Active alerts map
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   └── map_datasource.dart
│   │   │   ├── models/
│   │   │   │   └── map_marker_model.dart
│   │   │   └── repositories/
│   │   │       └── map_repository.dart
│   │   ├── domain/
│   │   │   └── ...
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── map_provider.dart
│   │       ├── screens/
│   │       │   └── active_alerts_map_screen.dart
│   │       ├── widgets/
│   │       │   ├── custom_marker_widget.dart
│   │       │   ├── pulsing_circle_widget.dart
│   │       │   └── map_detail_sheet.dart
│   │       └── state/
│   │           └── map_state.dart
│   │
│   ├── sightings/                    # Sighting reports
│   │   ├── data/
│   │   │   └── ...
│   │   ├── domain/
│   │   │   └── ...
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── report_sighting_screen.dart
│   │       └── ...
│   │
│   ├── family/                       # Family group management
│   │   ├── data/
│   │   │   └── ...
│   │   ├── domain/
│   │   │   └── ...
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── family_group_screen.dart
│   │       ├── widgets/
│   │       │   └── family_member_card.dart
│   │       └── ...
│   │
│   └── profile/                      # User profile & settings
│       ├── data/
│       │   └── ...
│       ├── domain/
│       │   └── ...
│       └── presentation/
│           ├── screens/
│           │   └── profile_screen.dart
│           └── ...
│
├── models/                           # Shared data models
│   ├── user.dart
│   ├── missing_report.dart
│   ├── witness_alert.dart
│   ├── ble_encounter.dart
│   ├── sighting.dart
│   ├── family_group.dart
│   └── enums.dart                    # Status, alert types, etc
│
├── services/                         # Services (cross-feature)
│   ├── api_service.dart              # HTTP client (Dio)
│   ├── ble_service.dart              # BLE operations
│   ├── location_service.dart         # GPS/location
│   ├── storage_service.dart          # Secure storage
│   ├── database_service.dart         # SQLite access
│   ├── notification_service.dart     # FCM handling
│   ├── websocket_service.dart        # Real-time connection
│   └── logger_service.dart           # Logging
│
├── repositories/                     # Data access patterns
│   ├── base_repository.dart          # Abstract base
│   ├── user_repository.dart
│   ├── report_repository.dart
│   ├── alert_repository.dart
│   └── ...
│
├── providers/                        # Global Riverpod providers
│   ├── service_providers.dart        # Services (singleton)
│   ├── repository_providers.dart     # Repositories
│   ├── api_provider.dart             # API client
│   └── connectivity_provider.dart    # Internet status
│
├── widgets/                          # Reusable components
│   ├── buttons/
│   │   ├── primary_button.dart
│   │   ├── secondary_button.dart
│   │   └── custom_fab.dart
│   ├── cards/
│   │   ├── alert_card.dart
│   │   ├── info_card.dart
│   │   └── custom_card.dart
│   ├── dialogs/
│   │   ├── confirm_dialog.dart
│   │   ├── error_dialog.dart
│   │   └── custom_modal.dart
│   ├── inputs/
│   │   ├── phone_input.dart
│   │   ├── search_field.dart
│   │   └── custom_field.dart
│   ├── loaders/
│   │   ├── loading_overlay.dart
│   │   └── shimmer_loader.dart
│   └── others/
│       ├── snackbar_helper.dart
│       ├── custom_appbar.dart
│       └── ...
│
└── screens/
    ├── splash_screen.dart
    ├── nav_shell.dart                 # Navigation container
    └── error_screen.dart
```

---

## State Management Strategy (Riverpod)

### Provider Types Used

#### 1. **StateNotifier Providers** (Mutable State)
```dart
// For complex state with methods
class AlertsFeedNotifier extends StateNotifier<AlertsState> {
  AlertsFeedNotifier(this.repo) : super(AlertsInitial());
  
  final AlertsRepository repo;
  
  Future<void> fetchAlerts() async {
    state = AlertsLoading();
    try {
      final alerts = await repo.getAlerts();
      state = AlertsLoaded(alerts);
    } catch (e) {
      state = AlertsError(e.toString());
    }
  }
}

final alertsFeedProvider = StateNotifierProvider<AlertsFeedNotifier, AlertsState>((ref) {
  final repo = ref.watch(alertsRepositoryProvider);
  return AlertsFeedNotifier(repo);
});
```

#### 2. **FutureProvider** (Async Data)
```dart
// For one-time async operations
final getUserProvider = FutureProvider<User>((ref) async {
  final authRepo = ref.watch(authRepositoryProvider);
  return authRepo.getCurrentUser();
});
```

#### 3. **StreamProvider** (Real-Time Data)
```dart
// For WebSocket or location stream
final locationsStreamProvider = StreamProvider<Location>((ref) async* {
  final locationService = ref.watch(locationServiceProvider);
  yield* locationService.locationStream;
});
```

#### 4. **StateProvider** (Simple State)
```dart
// For UI flags (tab index, filter state, etc)
final selectedTabProvider = StateProvider<int>((ref) => 0);

// Usage
ref.read(selectedTabProvider.notifier).state = 1;
```

#### 5. **NotifierProvider** (New Riverpod approach)
```dart
// Modern approach (replaces StateNotifier + FamilyNotifier)
class AlertsNotifier extends Notifier<AlertsState> {
  @override
  AlertsState build() {
    return const AlertsInitial();
  }
  
  Future<void> fetchAlerts() async {
    state = const AlertsLoading();
    // Implementation
  }
}

final alertsProvider = NotifierProvider<AlertsNotifier, AlertsState>((ref) {
  return AlertsNotifier();
});
```

### Example: Complete State Management Flow

```dart
// ============ STATE DEFINITION ============
sealed class AlertsState {
  const AlertsState();
}

class AlertsInitial extends AlertsState {
  const AlertsInitial();
}

class AlertsLoading extends AlertsState {
  const AlertsLoading();
}

class AlertsLoaded extends AlertsState {
  final List<WitnessAlert> alerts;
  const AlertsLoaded(this.alerts);
}

class AlertsError extends AlertsState {
  final String message;
  const AlertsError(this.message);
}

// ============ NOTIFIER ============
class AlertsNotifier extends StateNotifier<AlertsState> {
  AlertsNotifier(this._repo) : super(const AlertsInitial());
  
  final AlertsRepository _repo;
  
  Future<void> fetchAlerts() async {
    state = const AlertsLoading();
    try {
      final alerts = await _repo.getAlerts();
      state = AlertsLoaded(alerts);
    } catch (e) {
      state = AlertsError(e.toString());
    }
  }
  
  Future<void> respondToAlert(String alertId, bool saw) async {
    try {
      await _repo.respondToAlert(alertId, saw);
      // Refresh alerts
      await fetchAlerts();
    } catch (e) {
      state = AlertsError(e.toString());
    }
  }
}

// ============ PROVIDER ============
final alertsProvider = StateNotifierProvider<AlertsNotifier, AlertsState>((ref) {
  final repo = ref.watch(alertsRepositoryProvider);
  return AlertsNotifier(repo);
});

// ============ UI USAGE ============
class HomeScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alertsState = ref.watch(alertsProvider);
    
    return RefreshIndicator(
      onRefresh: () => ref.read(alertsProvider.notifier).fetchAlerts(),
      child: switch (alertsState) {
        AlertsInitial() => Center(child: CircularProgressIndicator()),
        AlertsLoading() => Center(child: CircularProgressIndicator()),
        AlertsLoaded(:final alerts) => ListView.builder(
          itemCount: alerts.length,
          itemBuilder: (_, i) => WitnessAlertCard(alerts[i]),
        ),
        AlertsError(:final message) => ErrorWidget(message: message),
      },
    );
  }
}
```

---

## Services Architecture

### API Service
```dart
class ApiService {
  final Dio dio;
  final String baseUrl;
  
  // Interceptors for auth, logging, retry
  void setupInterceptors(String authToken) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          options.headers['Authorization'] = 'Bearer $authToken';
          return handler.next(options);
        },
      ),
    );
  }
  
  // Generic methods
  Future<T> get<T>(String path) async { }
  Future<T> post<T>(String path, dynamic data) async { }
  Future<T> postMultipart<T>(String path, FormData data) async { }
}
```

### BLE Service
```dart
class BleService {
  // Start scanning with UUID filter
  Future<void> startScanning(String serviceUuid);
  
  // Start advertising with rotating UUID
  Future<void> startAdvertising(String deviceUuid);
  
  // Get discovered devices stream
  Stream<BleDevice> get discoveredDevices;
  
  // Convert RSSI to distance
  double estimateDistance(int rssi);
}
```

### Location Service
```dart
class LocationService {
  // Get current location once
  Future<Location> getCurrentLocation();
  
  // Stream of location updates
  Stream<Location> get locationStream;
  
  // Request permissions
  Future<bool> requestPermissions();
}
```

### Storage Service
```dart
class StorageService {
  // Secure storage for tokens, keys
  Future<void> saveSecure(String key, String value);
  Future<String?> getSecure(String key);
  
  // Regular storage for user preferences
  Future<void> save(String key, dynamic value);
  Future<T?> get<T>(String key);
}
```

---

## Data Models & Serialization

```dart
// Example: Missing Report Model with serialization
class MissingReportModel extends MissingReportEntity {
  const MissingReportModel({
    required super.id,
    required super.personName,
    // ... other fields
  });
  
  // From JSON (API)
  factory MissingReportModel.fromJson(Map<String, dynamic> json) {
    return MissingReportModel(
      id: json['id'] as String,
      personName: json['person_name'] as String,
      // ... mapping
    );
  }
  
  // To JSON (API)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'person_name': personName,
      // ... mapping
    };
  }
  
  // From Entity
  factory MissingReportModel.fromEntity(MissingReportEntity entity) {
    return MissingReportModel(
      id: entity.id,
      personName: entity.personName,
      // ... conversion
    );
  }
  
  // To Entity
  @override
  MissingReportEntity toEntity() => this;
}
```

---

## Error Handling

```dart
sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;
}

class ServerException extends AppException {
  const ServerException(super.message);
}

class NetworkException extends AppException {
  const NetworkException(super.message);
}

class ValidationException extends AppException {
  const ValidationException(super.message);
}

// In repositories
Future<List<Alert>> getAlerts() async {
  try {
    final response = await apiService.get('/alerts');
    return response.map((a) => AlertModel.fromJson(a)).toList();
  } on DioException catch (e) {
    throw NetworkException(e.message ?? 'Network error');
  } catch (e) {
    throw ServerException('Failed to fetch alerts');
  }
}
```

---

## Testing Strategy

### Unit Tests
- Models (serialization, equality)
- Validators & utilities
- Business logic (distance calc, matching algo)

### Integration Tests
- Repository + DataSource layer
- API calls + parsing
- Database operations

### Widget Tests
- Component rendering
- User interactions
- State updates

### E2E Tests
- Register → Report → Witness Alert → Response
- Map interactions
- Profile management

---

**Last Updated**: 2026-06-27  
**Version**: 1.0
