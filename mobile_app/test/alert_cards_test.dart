import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/models/witness_alert.dart';
import 'package:mobile_app/widgets/cards/witness_alert_card.dart';
import 'package:mobile_app/features/alerts/presentation/widgets/area_alert_card.dart';

WitnessAlert _alert({required String type}) => WitnessAlert(
      id: '1',
      missingReportId: 'r1',
      witnessUserId: 'me',
      alertType: type,
      alertText: 'Test alert text',
      createdAt: DateTime(2026, 6, 27),
      personName: 'Test Person',
    );

void main() {
  testWidgets('WitnessAlertCard shows actions and fires onRespond',
      (tester) async {
    String? response;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: WitnessAlertCard(
          alert: _alert(type: 'ble_witness'),
          onRespond: (r) => response = r,
        ),
      ),
    ));

    expect(find.text('Test Person'), findsOneWidget);

    await tester.tap(find.text('View Details'));
    expect(response, equals('yes'));
  });

  testWidgets('AreaAlertCard fires onIWasThere', (tester) async {
    var tapped = false;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: AreaAlertCard(
          alert: _alert(type: 'gps_radius'),
          onIWasThere: () => tapped = true,
        ),
      ),
    ));

    expect(find.text('Test Person'), findsOneWidget);
    await tester.tap(find.text('View Details'));
    expect(tapped, isTrue);
  });
}
