import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../sightings/presentation/screens/report_sighting_screen.dart';
import '../../domain/map_marker.dart';
import '../providers/map_provider.dart';
import '../widgets/detail_sheet.dart';

/// Redesigned active alerts map screen matching the custom bottom card docked layout.
class ActiveAlertsMapScreen extends StatefulWidget {
  const ActiveAlertsMapScreen({super.key});

  @override
  State<ActiveAlertsMapScreen> createState() => _ActiveAlertsMapScreenState();
}

class _ActiveAlertsMapScreenState extends State<ActiveAlertsMapScreen>
    with SingleTickerProviderStateMixin {
  static const double _canvas = 1600;
  static const double _pxPerDegree = 90000; // visual zoom
  late final AnimationController _pulse;
  final _viewer = TransformationController();
  MapMarkerData? _selectedMarker;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<MapProvider>().load();
      _centerViewport();
    });
  }

  void _centerViewport() {
    // Centre the large canvas in the viewport.
    final size = MediaQuery.of(context).size;
    final dx = -(_canvas / 2) + size.width / 2;
    final dy = -(_canvas / 2) + size.height / 2;
    _viewer.value = Matrix4.identity()..translateByDouble(dx, dy, 0, 1);
  }

  @override
  void dispose() {
    _pulse.dispose();
    _viewer.dispose();
    super.dispose();
  }

  Offset _project(MapProvider p, double lat, double lng) {
    final dx = _canvas / 2 + (lng - p.centerLng) * _pxPerDegree;
    final dy = _canvas / 2 - (lat - p.centerLat) * _pxPerDegree;
    return Offset(dx, dy);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<MapProvider>();
    final text = Theme.of(context).textTheme;

    // Auto-select first missing alert if none is selected yet
    final visible = p.visibleMarkers;
    if (_selectedMarker == null && visible.isNotEmpty) {
      _selectedMarker = visible.firstWhere(
        (m) => m.kind == MarkerKind.missing,
        orElse: () => visible.first,
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // 1. Zoomable Abstract Vector Map Canvas
          InteractiveViewer(
            transformationController: _viewer,
            minScale: 0.5,
            maxScale: 4,
            constrained: false,
            boundaryMargin: const EdgeInsets.all(400),
            child: SizedBox(
              width: _canvas,
              height: _canvas,
              child: Stack(
                children: [
                  // Stylized Map streets and river backdrop
                  Positioned.fill(
                    child: CustomPaint(painter: _MapBackdropPainter()),
                  ),

                  // Pulsing cascade rings (missing markers with a radius).
                  ...p.visibleMarkers
                      .where((m) =>
                          m.kind == MarkerKind.missing && m.radiusMeters != null)
                      .map((m) {
                    final c = _project(p, m.latitude, m.longitude);
                    return AnimatedBuilder(
                      animation: _pulse,
                      builder: (context, _) {
                        final t = _pulse.value;
                        final maxR = (m.radiusMeters! / 1200).clamp(0.3, 2.0) * 130;
                        final r = maxR * t;
                        return Positioned(
                          left: c.dx - r,
                          top: c.dy - r,
                          child: Container(
                            width: r * 2,
                            height: r * 2,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFFEF4444).withOpacity(1 - t),
                                width: 2,
                              ),
                              color: const Color(0xFFEF4444).withOpacity((1 - t) * 0.08),
                            ),
                          ),
                        );
                      },
                    );
                  }),

                  // User location (blue dot).
                  if (p.userLat != null)
                    Builder(builder: (context) {
                      final c = _project(p, p.userLat!, p.userLng!);
                      return Positioned(
                        left: c.dx - 10,
                        top: c.dy - 10,
                        child: const _UserDot(),
                      );
                    }),

                  // Map Pins
                  ...p.visibleMarkers.map((m) {
                    final c = _project(p, m.latitude, m.longitude);
                    return Positioned(
                      left: c.dx - 22,
                      top: c.dy - 44,
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedMarker = m;
                          });
                        },
                        child: _Pin(marker: m, isSelected: _selectedMarker?.id == m.id),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),

          // 2. Floating Search Bar & Layers Toggle Row
          Positioned(
            top: 24,
            left: 16,
            right: 16,
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Row(
                        children: [
                          const Icon(Icons.search, color: Colors.black54),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              decoration: const InputDecoration(
                                hintText: 'Search areas or alerts...',
                                hintStyle: TextStyle(color: Colors.black38, fontSize: 14),
                                border: InputBorder.none,
                                isDense: true,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () => p.toggleLayer(MarkerKind.cctv),
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.layers_outlined,
                        color: p.layers[MarkerKind.cctv] == true ? const Color(0xFF8D5332) : Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Floating Recenter GPS Target Button
          Positioned(
            top: 96,
            right: 16,
            child: SafeArea(
              child: GestureDetector(
                onTap: () {
                  p.recenterOnUser();
                  _centerViewport();
                },
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.gps_fixed, color: Colors.black87),
                ),
              ),
            ),
          ),

          // 4. Selected Alert Details Floating Card (Docked at Bottom)
          if (_selectedMarker != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Grey indicator line
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Profile photo with red dot badge
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: _selectedMarker!.photoUrl != null
                                    ? DecorationImage(
                                        image: NetworkImage(_selectedMarker!.photoUrl!),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                                color: Colors.grey.shade200,
                              ),
                              child: _selectedMarker!.photoUrl == null
                                  ? const Icon(Icons.person, color: Colors.grey)
                                  : null,
                            ),
                            Positioned(
                              top: -2,
                              right: -2,
                              child: Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      _selectedMarker!.title,
                                      style: text.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                        color: Colors.black87,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (_selectedMarker!.kind == MarkerKind.missing)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFEE2E2),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'CRITICAL',
                                        style: TextStyle(
                                          color: Color(0xFFEF4444),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _selectedMarker!.kind == MarkerKind.missing
                                    ? 'Missing • 2 hours ago'
                                    : _selectedMarker!.label,
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _selectedMarker!.subtitle,
                                style: text.bodyMedium?.copyWith(
                                  color: Colors.grey.shade700,
                                  fontSize: 13,
                                  height: 1.3,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 46,
                            child: FilledButton.icon(
                              icon: const Icon(Icons.info_outline, size: 18),
                              label: const Text('Details'),
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF8D5332), // Rust brown
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              onPressed: () => MarkerDetailSheet.show(context, _selectedMarker!),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SizedBox(
                            height: 46,
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.directions, size: 18, color: Colors.black87),
                              label: const Text(
                                'Navigate',
                                style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
                              ),
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: const Color(0xFFF9F9F9),
                                  side: BorderSide(color: Colors.grey.shade300),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Navigating to ${_selectedMarker!.title}...'),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

          if (p.loading)
            const Positioned.fill(
              child: ColoredBox(
                color: Color(0x11000000),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
        ],
      ),
    );
  }
}

class _Pin extends StatelessWidget {
  const _Pin({required this.marker, required this.isSelected});
  final MapMarkerData marker;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    final pinColor = marker.color;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: EdgeInsets.all(isSelected ? 8 : 6),
          decoration: BoxDecoration(
            color: isSelected ? Colors.black87 : pinColor,
            shape: BoxShape.circle,
            boxShadow: const [
              BoxShadow(color: Color(0x33000000), blurRadius: 4, offset: Offset(0, 2)),
            ],
          ),
          child: Icon(
            marker.kind == MarkerKind.missing ? Icons.location_on : marker.icon,
            color: Colors.white,
            size: isSelected ? 22 : 20,
          ),
        ),
        CustomPaint(
          size: const Size(12, 8),
          painter: _PinTailPainter(isSelected ? Colors.black87 : pinColor),
        ),
      ],
    );
  }
}

class _PinTailPainter extends CustomPainter {
  _PinTailPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _UserDot extends StatelessWidget {
  const _UserDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        color: const Color(0xFF3B82F6),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: const [
          BoxShadow(color: Color(0x553B82F6), blurRadius: 8, spreadRadius: 2),
        ],
      ),
    );
  }
}

class _MapBackdropPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Draw background: light cream-grey
    canvas.drawRect(
        Offset.zero & size, Paint()..color = const Color(0xFFF3F5F2));

    // Draw grid roads/lines for a premium map-like feel.
    final roadPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round;

    final roadBorderPaint = Paint()
      ..color = const Color(0xFFE4E6E3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 16
      ..strokeCap = StrokeCap.round;

    // Draw winding roads
    final roadPaths = [
      Path()..moveTo(0, size.height * 0.2)..lineTo(size.width, size.height * 0.8),
      Path()..moveTo(0, size.height * 0.8)..lineTo(size.width, size.height * 0.2),
      Path()..moveTo(size.width * 0.3, 0)..lineTo(size.width * 0.3, size.height),
      Path()..moveTo(size.width * 0.7, 0)..lineTo(size.width * 0.7, size.height),
      Path()
        ..moveTo(0, size.height * 0.5)
        ..quadraticBezierTo(size.width * 0.5, size.height * 0.3, size.width, size.height * 0.5),
    ];

    // Draw road borders first
    for (final path in roadPaths) {
      canvas.drawPath(path, roadBorderPaint);
    }
    // Draw road fills next
    for (final path in roadPaths) {
      canvas.drawPath(path, roadPaint);
    }

    // Draw water body (river) crossing
    final water = Paint()
      ..color = const Color(0xFFD4E8F2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 32
      ..strokeCap = StrokeCap.round;

    final waterPath = Path()
      ..moveTo(0, size.height * 0.1)
      ..cubicTo(size.width * 0.4, size.height * 0.15, size.width * 0.6,
          size.height * 0.4, size.width, size.height * 0.4);
    canvas.drawPath(waterPath, water);
  }

  @override
  bool shouldRepaint(covariant _MapBackdropPainter oldDelegate) => false;
}
