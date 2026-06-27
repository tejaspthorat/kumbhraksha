import 'package:flutter/foundation.dart';

import '../models/missing_report.dart';
import '../repositories/report_repository.dart';
import '../services/location_service.dart';

enum ReportSubmitState { idle, submitting, success, error }

/// Holds the in-progress missing-person report form and handles submission.
class ReportFormProvider extends ChangeNotifier {
  ReportFormProvider(this._repo, this._location);

  final ReportRepository _repo;
  final LocationService _location;

  // Form fields
  String personName = '';
  int? personAge;
  String personGender = 'M';
  String? photoPath;
  Clothing clothing = const Clothing();
  String? build;
  String distinguishingFeatures = '';
  String medicalConditions = '';
  double? lastSeenLatitude;
  double? lastSeenLongitude;
  DateTime lastSeenTime = DateTime.now();

  ReportSubmitState state = ReportSubmitState.idle;
  String? errorMessage;
  int? witnessCount;
  String? submittedReportId;

  void update({
    String? personName,
    int? personAge,
    String? personGender,
    String? photoPath,
    String? build,
    String? distinguishingFeatures,
    String? medicalConditions,
    DateTime? lastSeenTime,
  }) {
    if (personName != null) this.personName = personName;
    if (personAge != null) this.personAge = personAge;
    if (personGender != null) this.personGender = personGender;
    if (photoPath != null) this.photoPath = photoPath;
    if (build != null) this.build = build;
    if (distinguishingFeatures != null) {
      this.distinguishingFeatures = distinguishingFeatures;
    }
    if (medicalConditions != null) this.medicalConditions = medicalConditions;
    if (lastSeenTime != null) this.lastSeenTime = lastSeenTime;
    notifyListeners();
  }

  void updateClothing(Clothing c) {
    clothing = c;
    notifyListeners();
  }

  Future<void> captureCurrentLocation() async {
    final pos = await _location.getCurrentLocation();
    if (pos != null) {
      lastSeenLatitude = pos.latitude;
      lastSeenLongitude = pos.longitude;
      notifyListeners();
    }
  }

  Future<bool> submit(String reporterId) async {
    state = ReportSubmitState.submitting;
    errorMessage = null;
    notifyListeners();

    if (lastSeenLatitude == null || lastSeenLongitude == null) {
      await captureCurrentLocation();
    }

    final report = MissingReport(
      id: ReportRepository.newReportId(),
      reporterId: reporterId,
      personName: personName.trim(),
      personAge: personAge ?? 0,
      personGender: personGender,
      photoUrl: photoPath,
      clothing: clothing,
      build: build,
      distinguishingFeatures:
          distinguishingFeatures.trim().isEmpty ? null : distinguishingFeatures.trim(),
      medicalConditions:
          medicalConditions.trim().isEmpty ? null : medicalConditions.trim(),
      lastSeenLatitude: lastSeenLatitude ?? 0,
      lastSeenLongitude: lastSeenLongitude ?? 0,
      lastSeenTime: lastSeenTime,
      reportedAt: DateTime.now(),
    );

    try {
      final result = await _repo.submit(report);
      submittedReportId = result.reportId;
      witnessCount = result.witnessCount;
      state = ReportSubmitState.success;
      notifyListeners();
      return true;
    } catch (e) {
      errorMessage = e.toString();
      state = ReportSubmitState.error;
      notifyListeners();
      return false;
    }
  }

  void reset() {
    personName = '';
    personAge = null;
    personGender = 'M';
    photoPath = null;
    clothing = const Clothing();
    build = null;
    distinguishingFeatures = '';
    medicalConditions = '';
    lastSeenLatitude = null;
    lastSeenLongitude = null;
    lastSeenTime = DateTime.now();
    state = ReportSubmitState.idle;
    errorMessage = null;
    witnessCount = null;
    submittedReportId = null;
    notifyListeners();
  }
}
