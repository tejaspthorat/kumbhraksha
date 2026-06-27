import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/models/user.dart';
import 'package:mobile_app/models/missing_report.dart';
import 'package:mobile_app/core/utils/distance_calculator.dart';

void main() {
  group('User model', () {
    test('round-trips through JSON', () {
      final user = User(
        id: '123',
        phoneNumber: '+919876543210',
        languagePreference: 'hindi',
        isOnboarded: true,
        createdAt: DateTime.parse('2026-06-27T10:00:00Z'),
      );
      final decoded = User.fromJson(user.toJson());
      expect(decoded, equals(user));
    });

    test('copyWith updates a single field', () {
      final user = User(
        id: '1',
        phoneNumber: '+910000000000',
        languagePreference: 'english',
        isOnboarded: false,
        createdAt: DateTime(2026, 6, 27),
      );
      expect(user.copyWith(isOnboarded: true).isOnboarded, isTrue);
      expect(user.copyWith(isOnboarded: true).id, equals('1'));
    });
  });

  group('MissingReport model', () {
    test('serializes and reports active status', () {
      final report = MissingReport(
        id: 'r1',
        reporterId: 'u1',
        personName: 'Aarav',
        personAge: 7,
        personGender: 'M',
        clothing: const Clothing(topColor: 'Red', topType: 'T-shirt'),
        lastSeenLatitude: 25.4,
        lastSeenLongitude: 81.8,
        lastSeenTime: DateTime(2026, 6, 27, 14, 10),
        reportedAt: DateTime(2026, 6, 27, 14, 20),
      );
      final decoded = MissingReport.fromJson(report.toJson());
      expect(decoded.personName, equals('Aarav'));
      expect(decoded.getClothingDescription(), contains('Red'));
      expect(decoded.isActive, isTrue);
    });
  });

  group('DistanceCalculator', () {
    test('estimates near distance at strong RSSI', () {
      expect(DistanceCalculator.estimateDistance(rssi: -59), lessThan(1.5));
    });

    test('clamps invalid and out-of-range RSSI', () {
      expect(DistanceCalculator.estimateDistance(rssi: 0), equals(0.0));
      expect(DistanceCalculator.estimateDistance(rssi: -130), equals(100.0));
    });
  });
}
