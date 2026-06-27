import 'package:flutter/foundation.dart';

import '../models/sighting.dart';
import '../repositories/sighting_repository.dart';
import '../services/location_service.dart';

enum SightingSubmitState { idle, submitting, success, error }

/// Drives the proactive "Report a sighting" form.
class SightingProvider extends ChangeNotifier {
  SightingProvider(this._repo, this._location);

  final SightingRepository _repo;
  final LocationService _location;

  String personType = 'child';
  String gender = 'M';
  String behavior = 'wandering';
  String? photoPath;
  String notes = '';
  int? approxAge;
  double? latitude;
  double? longitude;
  bool guideToHelp = false;

  SightingSubmitState state = SightingSubmitState.idle;
  String? errorMessage;
  double? matchConfidence;

  void update({
    String? personType,
    String? gender,
    String? behavior,
    String? photoPath,
    String? notes,
    int? approxAge,
    bool? guideToHelp,
  }) {
    if (personType != null) this.personType = personType;
    if (gender != null) this.gender = gender;
    if (behavior != null) this.behavior = behavior;
    if (photoPath != null) this.photoPath = photoPath;
    if (notes != null) this.notes = notes;
    if (approxAge != null) this.approxAge = approxAge;
    if (guideToHelp != null) this.guideToHelp = guideToHelp;
    notifyListeners();
  }

  Future<void> captureLocation() async {
    final pos = await _location.getCurrentLocation();
    if (pos != null) {
      latitude = pos.latitude;
      longitude = pos.longitude;
      notifyListeners();
    }
  }

  Future<bool> submit() async {
    state = SightingSubmitState.submitting;
    errorMessage = null;
    notifyListeners();
    if (latitude == null || longitude == null) await captureLocation();

    final sighting = Sighting(
      id: SightingRepository.newId(),
      spotterUserId: 'me',
      personType: personType,
      approxAge: approxAge,
      gender: gender,
      behavior: behavior,
      photoUrl: photoPath,
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      notes: notes.trim().isEmpty ? null : notes.trim(),
      createdAt: DateTime.now(),
    );

    try {
      final saved = await _repo.submit(sighting);
      matchConfidence = saved.matcherConfidence;
      state = SightingSubmitState.success;
      notifyListeners();
      return true;
    } catch (e) {
      errorMessage = e.toString();
      state = SightingSubmitState.error;
      notifyListeners();
      return false;
    }
  }

  void reset() {
    personType = 'child';
    gender = 'M';
    behavior = 'wandering';
    photoPath = null;
    notes = '';
    approxAge = null;
    latitude = null;
    longitude = null;
    guideToHelp = false;
    state = SightingSubmitState.idle;
    errorMessage = null;
    matchConfidence = null;
    notifyListeners();
  }
}
