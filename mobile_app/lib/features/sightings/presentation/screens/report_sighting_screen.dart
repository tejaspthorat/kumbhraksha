import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../providers/sighting_provider.dart';

/// Redesigned citizen sighting report form screen matching the white-mode design.
class ReportSightingScreen extends StatefulWidget {
  const ReportSightingScreen({super.key});
  static const String route = '/sighting/report';

  @override
  State<ReportSightingScreen> createState() => _ReportSightingScreenState();
}

class _ReportSightingScreenState extends State<ReportSightingScreen> {
  final _notes = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<SightingProvider>().captureLocation());
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(SightingProvider p) async {
    final file = await ImagePicker().pickImage(
        source: ImageSource.camera, maxWidth: 1024, imageQuality: 80);
    if (file != null) p.update(photoPath: file.path);
  }

  Future<void> _submit(SightingProvider p) async {
    p.update(
      notes: _notes.text,
      personType: 'adult',
      behavior: 'wandering',
    );
    final ok = await p.submit();
    if (!mounted) return;
    if (ok) {
      _showSuccess(p);
    } else {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(p.errorMessage ?? 'Failed')));
    }
  }

  void _showSuccess(SightingProvider p) {
    final scheme = Theme.of(context).colorScheme;
    final conf = p.matchConfidence;
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimens.radiusSheet)),
      ),
      builder: (sheet) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimens.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.volunteer_activism, color: scheme.tertiary, size: 60),
              const SizedBox(height: Dimens.lg),
              Text('Thank you for helping',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: Dimens.sm),
              Text(
                conf != null
                    ? 'This may match an active case (${(conf * 100).round()}% likely). Authorities have been alerted.'
                    : 'Your sighting was shared with nearby authorities.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: Dimens.xl),
              FilledButton(
                onPressed: () {
                  p.reset();
                  Navigator.of(sheet).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('Done'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    String? hintText,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(color: Colors.black38),
      filled: true,
      fillColor: const Color(0xFFF2F2F2),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF8D5332), width: 1.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<SightingProvider>();
    final text = Theme.of(context).textTheme;
    final busy = p.state == SightingSubmitState.submitting;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: Dimens.lg, vertical: Dimens.sm),
          children: [
            Text(
              'Report a Sighting',
              style: text.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 26,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 20),

            // Section 1: Smartphone view camera viewfinder frame
            GestureDetector(
              onTap: () => _pickPhoto(p),
              child: Container(
                height: 380,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFF2C2C2C), // Dark smartphone screen color
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Subtly simulated smartphone screen background
                      if (p.photoPath != null)
                        Positioned.fill(
                          child: Image.file(
                            File(p.photoPath!),
                            fit: BoxFit.cover,
                          ),
                        )
                      else ...[
                        // Viewport inner simulated phone outline
                        Container(
                          width: 220,
                          height: 340,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white24, width: 2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        // Inner camera grid/circle overlay
                        Container(
                          width: 70,
                          height: 70,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withOpacity(0.08), width: 1.5),
                          ),
                        ),
                      ],

                      // White corner crop marks
                      Positioned.fill(
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: CustomPaint(
                            painter: BracketPainter(),
                          ),
                        ),
                      ),

                      // Glossy white camera shutter button & prompt text at bottom
                      Positioned(
                        bottom: 24,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // White shutter button
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 4),
                              ),
                              padding: const EdgeInsets.all(4),
                              child: Container(
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Tap to capture photo',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Section 2: GPS Location Bar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFECECEC),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.location_on,
                    color: Color(0xFF8D5332),
                    size: 24,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'GPS Location Captured',
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          p.latitude != null && p.longitude != null
                              ? 'Lat: ${p.latitude!.toStringAsFixed(4)}, Long: ${p.longitude!.toStringAsFixed(4)}'
                              : 'Detecting GPS location...',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Section 3: Additional Details
            Text(
              'Additional Details',
              style: text.titleMedium?.copyWith(
                color: Colors.black87,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _notes,
              maxLines: 4,
              decoration: _inputDecoration(
                hintText: 'e.g., sitting alone on the bench, wearing a bright red jacket, seems disoriented...',
              ),
            ),
            const SizedBox(height: 24),

            // Section 4: Submit Sighting button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton(
                onPressed: busy ? null : () => _submit(p),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF8D5332), // Rust brown
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: busy
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send_outlined, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Submit Sighting',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: Dimens.sm),
            const Center(
              child: Text(
                'Authorities will be notified immediately.',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}

/// Custom painter to draw white bracket marks at four corners.
class BracketPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.85)
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke;

    const len = 22.0;

    // Top left
    canvas.drawPath(Path()..moveTo(0, len)..lineTo(0, 0)..lineTo(len, 0), paint);
    // Top right
    canvas.drawPath(Path()..moveTo(size.width - len, 0)..lineTo(size.width, 0)..lineTo(size.width, len), paint);
    // Bottom left
    canvas.drawPath(Path()..moveTo(0, size.height - len)..lineTo(0, size.height)..lineTo(len, size.height), paint);
    // Bottom right
    canvas.drawPath(Path()..moveTo(size.width - len, size.height)..lineTo(size.width, size.height)..lineTo(size.width, size.height - len), paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
