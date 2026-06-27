import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'providers/alerts_feed_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/ble_provider.dart';
import 'providers/family_provider.dart';
import 'providers/report_form_provider.dart';
import 'providers/sighting_provider.dart';
import 'repositories/alerts_repository.dart';
import 'repositories/auth_repository.dart';
import 'repositories/encounter_repository.dart';
import 'repositories/family_repository.dart';
import 'repositories/report_repository.dart';
import 'repositories/sighting_repository.dart';
import 'screens/nav_shell.dart';
import 'screens/splash_screen.dart';
import 'features/auth/presentation/screens/language_selection_screen.dart';
import 'features/auth/presentation/screens/permissions_screen.dart';
import 'features/auth/presentation/screens/phone_input_screen.dart';
import 'features/auth/presentation/screens/otp_verification_screen.dart';
import 'features/family/presentation/screens/add_family_member_screen.dart';
import 'features/family/presentation/screens/family_group_screen.dart';
import 'features/report/presentation/screens/report_missing_screen.dart';
import 'features/sightings/presentation/screens/report_sighting_screen.dart';
import 'features/map/presentation/providers/map_provider.dart';
import 'services/api_service.dart';
import 'services/ble_service.dart';
import 'services/database_service.dart';
import 'services/location_service.dart';
import 'services/notification_service.dart';
import 'services/storage_service.dart';
import 'services/websocket_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Service singletons (composition root).
  final storage = StorageService();
  final database = DatabaseService();
  final api = ApiService(storage);
  final bleService = BleService();
  final locationService = LocationService(storage);
  final wsService = WebSocketService();
  final notificationService = NotificationService(storage);
  notificationService.init();

  final authRepo = AuthRepository(api, storage);
  final encounterRepo = EncounterRepository(database);
  final reportRepo = ReportRepository(api, database);
  final alertsRepo = AlertsRepository(api);
  final sightingRepo = SightingRepository(api);
  final familyRepo = FamilyRepository(storage);

  runApp(KumbhRakshaApp(
    authRepo: authRepo,
    encounterRepo: encounterRepo,
    reportRepo: reportRepo,
    alertsRepo: alertsRepo,
    sightingRepo: sightingRepo,
    familyRepo: familyRepo,
    bleService: bleService,
    locationService: locationService,
    wsService: wsService,
  ));
}

class KumbhRakshaApp extends StatelessWidget {
  const KumbhRakshaApp({
    super.key,
    required this.authRepo,
    required this.encounterRepo,
    required this.reportRepo,
    required this.alertsRepo,
    required this.sightingRepo,
    required this.familyRepo,
    required this.bleService,
    required this.locationService,
    required this.wsService,
  });

  final AuthRepository authRepo;
  final EncounterRepository encounterRepo;
  final ReportRepository reportRepo;
  final AlertsRepository alertsRepo;
  final SightingRepository sightingRepo;
  final FamilyRepository familyRepo;
  final BleService bleService;
  final LocationService locationService;
  final WebSocketService wsService;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(authRepo)),
        ChangeNotifierProvider(create: (_) => BleProvider(bleService, encounterRepo)),
        ChangeNotifierProvider(
            create: (_) => ReportFormProvider(reportRepo, locationService)),
        ChangeNotifierProvider(
            create: (_) =>
                AlertsFeedProvider(alertsRepo, wsService, locationService)),
        ChangeNotifierProvider(
            create: (_) => SightingProvider(sightingRepo, locationService)),
        ChangeNotifierProvider(create: (_) => MapProvider(locationService)),
        ChangeNotifierProvider(create: (_) => FamilyProvider(familyRepo)),
      ],
      child: MaterialApp(
        title: 'KumbhRaksha',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.system,
        initialRoute: SplashScreen.route,
        routes: {
          SplashScreen.route: (_) => const SplashScreen(),
          LanguageSelectionScreen.route: (_) => const LanguageSelectionScreen(),
          PermissionsScreen.route: (_) => const PermissionsScreen(),
          PhoneInputScreen.route: (_) => const PhoneInputScreen(),
          OtpVerificationScreen.route: (_) => const OtpVerificationScreen(),
          NavShell.route: (_) => const NavShell(),
          ReportMissingScreen.route: (_) => const ReportMissingScreen(),
          ReportSightingScreen.route: (_) => const ReportSightingScreen(),
          FamilyGroupScreen.route: (_) => const FamilyGroupScreen(),
          AddFamilyMemberScreen.route: (_) => const AddFamilyMemberScreen(),
        },
      ),
    );
  }
}
