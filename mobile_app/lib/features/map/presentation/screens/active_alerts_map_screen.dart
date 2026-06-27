import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../sightings/presentation/screens/report_sighting_screen.dart';
import '../../domain/map_marker.dart';
import '../providers/map_provider.dart';
import '../widgets/detail_sheet.dart';

/// Active alerts map. A pure-Dart interactive map (pan/zoom via InteractiveViewer)
/// with pulsing cascade rings, layer toggles, user location and tap-to-detail.
/// Drop-in replaceable with `google_maps_flutter` once an API key is configured.
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

    return Scaffold(
      appBar: AppBar(title: const Text('Active alerts')),
      body: Stack(
        children: [
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
                  // Map backdrop.
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
                                color: m.color.withValues(alpha: 1 - t),
                                width: 2,
                              ),
                              color: m.color.withValues(alpha: (1 - t) * 0.08),
                            ),
                          ),
                        );
                      },
                    );
                  }),

                  // Density heatmap blobs (optional layer).
                  if (p.showDensity)
                    ...p.visibleMarkers.map((m) {
                      final c = _project(p, m.latitude, m.longitude);
                      return Positioned(
                        left: c.dx - 50,
                        top: c.dy - 50,
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(colors: [
                              m.color.withValues(alpha: 0.25),
                              m.color.withValues(alpha: 0),
                            ]),
                          ),
                        ),
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

                  // Markers.
                  ...p.visibleMarkers.map((m) {
                    final c = _project(p, m.latitude, m.longitude);
                    return Positioned(
                      left: c.dx - 22,
                      top: c.dy - 44,
                      child: GestureDetector(
                        onTap: () => MarkerDetailSheet.show(context, m),
                        child: _Pin(marker: m),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),

          // Layer toggles.
          Positioned(
            top: Dimens.md,
            left: Dimens.md,
            right: Dimens.md,
            child: _LayerBar(provider: p),
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
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton.small(
            heroTag: 'recenter',
            onPressed: () {
              p.recenterOnUser();
              _centerViewport();
            },
            child: const Icon(Icons.my_location),
          ),
          const SizedBox(height: Dimens.sm),
          FloatingActionButton.extended(
            heroTag: 'sighting',
            onPressed: () =>
                Navigator.of(context).pushNamed(ReportSightingScreen.route),
            icon: const Icon(Icons.add_location_alt),
            label: const Text('Report sighting'),
          ),
        ],
      ),
    );
  }
}

class _LayerBar extends StatelessWidget {
  const _LayerBar({required this.provider});
  final MapProvider provider;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: Dimens.sm, vertical: Dimens.xs),
        child: Wrap(
          spacing: Dimens.sm,
          children: [
            for (final kind in MarkerKind.values)
              FilterChip(
                label: Text(_label(kind)),
                avatar: Icon(_icon(kind), size: 18, color: _color(kind)),
                selected: provider.layers[kind] ?? false,
                onSelected: (_) => provider.toggleLayer(kind),
              ),
            FilterChip(
              label: const Text('Density'),
              avatar: const Icon(Icons.blur_on, size: 18),
              selected: provider.showDensity,
              onSelected: (_) => provider.toggleDensity(),
            ),
          ],
        ),
      ),
    );
  }

  String _label(MarkerKind k) => switch (k) {
        MarkerKind.missing => 'Missing',
        MarkerKind.sighting => 'Sightings',
        MarkerKind.cctv => 'CCTV',
      };
  IconData _icon(MarkerKind k) => switch (k) {
        MarkerKind.missing => Icons.person_pin_circle,
        MarkerKind.sighting => Icons.visibility,
        MarkerKind.cctv => Icons.videocam,
      };
  Color _color(MarkerKind k) => switch (k) {
        MarkerKind.missing => const Color(0xFFEF4444),
        MarkerKind.sighting => const Color(0xFFF59E0B),
        MarkerKind.cctv => const Color(0xFF6366F1),
      };
}

class _Pin extends StatelessWidget {
  const _Pin({required this.marker});
  final MapMarkerData marker;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: marker.color,
            shape: BoxShape.circle,
            boxShadow: const [
              BoxShadow(color: Color(0x33000000), blurRadius: 4, offset: Offset(0, 2)),
            ],
          ),
          child: Icon(marker.icon, color: Colors.white, size: 20),
        ),
        CustomPaint(size: const Size(12, 8), painter: _PinTailPainter(marker.color)),
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
    canvas.drawRect(
        Offset.zero & size, Paint()..color = const Color(0xFFE8EDF2));

    // Grid lines for a map-like feel.
    final grid = Paint()
      ..color = const Color(0xFFD3DBE3)
      ..strokeWidth = 1;
    const step = 80.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }

    // A stylised river band crossing the area.
    final river = Paint()
      ..color = const Color(0xFFBFE0F2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 46
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..moveTo(0, size.height * 0.35)
      ..cubicTo(size.width * 0.3, size.height * 0.25, size.width * 0.55,
          size.height * 0.6, size.width, size.height * 0.5);
    canvas.drawPath(path, river);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
