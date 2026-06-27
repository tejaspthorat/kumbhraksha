import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/witness_alert.dart';
import '../../../../providers/alerts_feed_provider.dart';

/// Redesigned citizen Confirm Sighting (I See Them) form screen.
class ConfirmSightingScreen extends StatefulWidget {
  const ConfirmSightingScreen({super.key, required this.alert});
  static const String route = '/sighting/confirm';

  final WitnessAlert alert;

  @override
  State<ConfirmSightingScreen> createState() => _ConfirmSightingScreenState();
}

class _ConfirmSightingScreenState extends State<ConfirmSightingScreen> {
  String? _photoPath;
  bool _shareLocation = true;
  bool _submitting = false;

  Future<void> _pickPhoto() async {
    final file = await ImagePicker().pickImage(
        source: ImageSource.camera, maxWidth: 1024, imageQuality: 80);
    if (file != null) setState(() => _photoPath = file.path);
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await context.read<AlertsFeedProvider>().submitSighting(
            alert: widget.alert,
            personType: 'adult',
            gender: widget.alert.gender ?? 'M',
            behavior: 'wandering',
            photoPath: _photoPath,
            notes: null,
            shareLocation: _shareLocation,
            confidence: 0.9,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sighting shared. Authorities notified.')),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  String _formatTimeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inHours >= 1) {
      return 'Reported missing ${diff.inHours} hrs ago';
    } else if (diff.inMinutes >= 1) {
      return 'Reported missing ${diff.inMinutes} min ago';
    }
    return 'Reported missing just now';
  }

  Widget _sectionHeader(String number, String title) {
    return Row(
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: const BoxDecoration(
            color: Color(0xFFECECEC),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            number,
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: Colors.black87,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final scheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: Dimens.lg, vertical: Dimens.sm),
                children: [
                  // 1. Active Search Profile Header Card
                  Container(
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outlineVariant, width: 1),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        // Profile image
                        ClipRRect(
                          borderRadius: BorderRadius.circular(28),
                          child: Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: scheme.surfaceDim,
                              image: widget.alert.photoUrl != null
                                  ? DecorationImage(
                                      image: NetworkImage(widget.alert.photoUrl!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: widget.alert.photoUrl == null
                                ? Icon(Icons.person_outline_rounded, color: scheme.onSurface.withOpacity(0.4))
                                : null,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Active search tag
                              Row(
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: scheme.error,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'ACTIVE SEARCH',
                                    style: TextStyle(
                                      color: scheme.error,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                widget.alert.personName ?? 'Reported Person',
                                style: text.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: scheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _formatTimeAgo(widget.alert.createdAt),
                                style: TextStyle(
                                  color: scheme.onSurface.withOpacity(0.5),
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

                  // 2. Section 1: Confirm with Photo
                  _sectionHeader('1', 'Confirm with Photo'),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: _pickPhoto,
                    child: CustomPaint(
                      painter: _photoPath == null
                          ? DashedBorderPainter(color: scheme.outline, strokeWidth: 1.2, gap: 8)
                          : null,
                      child: Container(
                        width: double.infinity,
                        height: 160,
                        decoration: BoxDecoration(
                          color: scheme.surfaceDim,
                          borderRadius: BorderRadius.circular(12),
                          image: _photoPath != null
                              ? DecorationImage(
                                  image: FileImage(File(_photoPath!)),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: _photoPath != null
                            ? null
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.camera_alt_outlined, color: scheme.onSurface.withOpacity(0.5), size: 28),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Tap to capture current appearance',
                                    style: text.bodyMedium?.copyWith(
                                      color: scheme.onSurface.withOpacity(0.5),
                                      fontWeight: FontWeight.w500,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 3. Section 2: Current Location
                  _sectionHeader('2', 'Current Location'),
                  const SizedBox(height: 12),
                  Container(
                    height: 140,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: scheme.brightness == Brightness.light ? const Color(0xFFCBE3F5) : const Color(0xFF1E2F3F), // Map background compatible
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: scheme.outlineVariant),
                    ),
                    child: Stack(
                      children: [
                        // Map streets lines illustration
                        Positioned.fill(
                          child: CustomPaint(
                            painter: _MapBackdropMiniPainter(),
                          ),
                        ),
                        // Bottom left: Auto-captured and address overlay
                        Positioned(
                          bottom: 12,
                          left: 12,
                          right: 60,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.gps_fixed, color: Colors.white, size: 12),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Auto-captured',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.9),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                widget.alert.distanceText ?? 'Centennial Park Mela Ground',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  shadows: [
                                    Shadow(color: Colors.black45, blurRadius: 4, offset: Offset(0, 1)),
                                  ],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        // Bottom right: Refresh icon button
                        Positioned(
                          bottom: 12,
                          right: 12,
                          child: GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('GPS location refreshed.')),
                              );
                            },
                            child: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.black.withOpacity(0.3),
                                border: Border.all(color: Colors.white.withOpacity(0.6), width: 1.5),
                              ),
                              child: const Icon(Icons.refresh, color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 4. Section 3: Immediate Protocol
                  _sectionHeader('3', 'Immediate Protocol'),
                  const SizedBox(height: 12),
                  // Action 1: Call Emergency Contact
                  GestureDetector(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Initiating call connection (number masked)...')),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: scheme.outlineVariant, width: 1),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: scheme.surfaceDim,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.phone, color: scheme.secondary, size: 18),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Call Emergency Contact',
                                  style: TextStyle(
                                    color: scheme.onSurface,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Icon(Icons.lock_outline, color: scheme.onSurface.withOpacity(0.4), size: 12),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Number Masked',
                                      style: TextStyle(
                                        color: scheme.onSurface.withOpacity(0.4),
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded, color: scheme.onSurface.withOpacity(0.4)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Action 2: Stay with them switch
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: scheme.outlineVariant, width: 1),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Stay with them',
                                style: TextStyle(
                                  color: scheme.onSurface,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Continuously share your live location with responders',
                                style: TextStyle(
                                  color: scheme.onSurface.withOpacity(0.5),
                                  fontSize: 12,
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Switch.adaptive(
                          value: _shareLocation,
                          activeColor: scheme.secondary,
                          onChanged: (v) {
                            setState(() {
                              _shareLocation = v;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),

            // Bottom Section containing dispatch button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: Dimens.lg, vertical: 16),
              decoration: BoxDecoration(
                color: scheme.surface,
                border: Border(top: BorderSide(color: scheme.outlineVariant, width: 1)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton(
                      onPressed: _submitting ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF8D5332), // Rust brown
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _submitting
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
                                    'Send Details to Authorities',
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
                  const SizedBox(height: 6),
                  Text(
                    'By sending, you agree to share your location data.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Custom painter to draw a dashed border.
class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double gap;

  DashedBorderPainter({
    this.color = Colors.grey,
    this.strokeWidth = 1.0,
    this.gap = 5.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(12),
      ));

    for (PathMetric pathMetric in path.computeMetrics()) {
      double distance = 0.0;
      while (distance < pathMetric.length) {
        final double nextLen = distance + gap;
        final double len = nextLen < pathMetric.length ? nextLen : pathMetric.length;
        canvas.drawPath(
          pathMetric.extractPath(distance, len - gap / 2),
          paint,
        );
        distance = len;
      }
    }
  }

  @override
  bool shouldRepaint(covariant DashedBorderPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.gap != gap;
  }
}

/// Mini map backdrop painter to display winding roads and water overlay
class _MapBackdropMiniPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
        Offset.zero & size, Paint()..color = const Color(0xFFCBE3F5));

    final road = Paint()
      ..color = Colors.white.withOpacity(0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(Offset(0, size.height * 0.3), Offset(size.width, size.height * 0.5), road);
    canvas.drawLine(Offset(size.width * 0.4, 0), Offset(size.width * 0.6, size.height), road);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
