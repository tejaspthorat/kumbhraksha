import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/validators.dart';
import '../../../../models/enums.dart';
import '../../../../models/missing_report.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/report_form_provider.dart';

/// Full missing-person report form matching the white-mode design.
class ReportMissingScreen extends StatefulWidget {
  const ReportMissingScreen({super.key});
  static const String route = '/report';

  @override
  State<ReportMissingScreen> createState() => _ReportMissingScreenState();
}

class _ReportMissingScreenState extends State<ReportMissingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _age = TextEditingController();
  final _features = TextEditingController();
  final _clothing = TextEditingController();
  final _date = TextEditingController();
  final _time = TextEditingController();
  final _locationAddress = TextEditingController();
  final _medicalConditions = TextEditingController();
  final _reporterPhone = TextEditingController();

  String? _gender;
  String? _relationship;
  bool _hasMedicalConditions = false;
  DateTime _selectedDateTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    // Seed from any pre-filled values (e.g. quick report from a family member).
    final form = context.read<ReportFormProvider>();
    _name.text = form.personName;
    if (form.personAge != null) _age.text = form.personAge.toString();
    _features.text = form.distinguishingFeatures;
    _clothing.text = form.clothing.extras ?? '';
    _medicalConditions.text = form.medicalConditions;
    if (form.medicalConditions.isNotEmpty) {
      _hasMedicalConditions = true;
    }
    _selectedDateTime = form.lastSeenTime;
    _date.text = DateFormat('MM/dd/yyyy').format(_selectedDateTime);
    _time.text = DateFormat('hh:mm a').format(_selectedDateTime);
    
    if (form.lastSeenLatitude != null && form.lastSeenLongitude != null) {
      _locationAddress.text =
          "${form.lastSeenLatitude!.toStringAsFixed(4)}, ${form.lastSeenLongitude!.toStringAsFixed(4)}";
    }

    // Pre-populate reporter phone number
    final auth = context.read<AuthProvider>();
    _reporterPhone.text = auth.user?.phoneNumber ?? '';
    _gender = form.personGender;
  }

  @override
  void dispose() {
    _name.dispose();
    _age.dispose();
    _features.dispose();
    _clothing.dispose();
    _date.dispose();
    _time.dispose();
    _locationAddress.dispose();
    _medicalConditions.dispose();
    _reporterPhone.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ReportFormProvider form) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
        source: ImageSource.camera, maxWidth: 1024, imageQuality: 80);
    if (file != null) form.update(photoPath: file.path);
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDateTime,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() {
        _selectedDateTime = DateTime(
          date.year,
          date.month,
          date.day,
          _selectedDateTime.hour,
          _selectedDateTime.minute,
        );
        _date.text = DateFormat('MM/dd/yyyy').format(_selectedDateTime);
      });
    }
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_selectedDateTime),
    );
    if (time != null) {
      setState(() {
        _selectedDateTime = DateTime(
          _selectedDateTime.year,
          _selectedDateTime.month,
          _selectedDateTime.day,
          time.hour,
          time.minute,
        );
        _time.text = DateFormat('hh:mm a').format(_selectedDateTime);
      });
    }
  }

  Future<void> _autoDetectLocation(ReportFormProvider form) async {
    await form.captureCurrentLocation();
    if (form.lastSeenLatitude != null && form.lastSeenLongitude != null) {
      setState(() {
        _locationAddress.text =
            "${form.lastSeenLatitude!.toStringAsFixed(4)}, ${form.lastSeenLongitude!.toStringAsFixed(4)}";
      });
    }
  }

  Future<void> _submit(ReportFormProvider form) async {
    if (!_formKey.currentState!.validate()) return;
    
    final address = _locationAddress.text.trim();
    final rel = _relationship ?? 'Other';
    final detailsList = [
      _features.text.trim(),
      if (address.isNotEmpty) 'Last seen location: $address',
      'Relationship: $rel',
    ];

    form.update(
      personName: _name.text,
      personAge: int.tryParse(_age.text),
      personGender: _gender ?? 'M',
      distinguishingFeatures: detailsList.join('\n'),
      medicalConditions: _hasMedicalConditions ? _medicalConditions.text.trim() : '',
      lastSeenTime: _selectedDateTime,
    );
    form.updateClothing(Clothing(extras: _clothing.text.trim()));

    final reporterId = context.read<AuthProvider>().user?.id ?? 'anonymous';
    final ok = await form.submit(reporterId);
    if (!mounted) return;
    if (ok) {
      _showSuccess(form);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(form.errorMessage ?? 'Submission failed')),
      );
    }
  }

  void _showSuccess(ReportFormProvider form) {
    final scheme = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Dimens.radiusSheet)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimens.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle, color: scheme.tertiary, size: 64),
              const SizedBox(height: Dimens.lg),
              Text('Report submitted',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: Dimens.sm),
              Text(
                'Alerting ${form.witnessCount ?? 0} people who were near them. '
                'You will be notified of any responses.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: Dimens.xl),
              FilledButton(
                onPressed: () {
                  form.reset();
                  Navigator.of(sheetContext).pop();
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
    Widget? prefixIcon,
    Color? fillColor,
    BorderSide? borderSide,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return InputDecoration(
      hintText: hintText,
      hintStyle: TextStyle(color: scheme.onSurface.withOpacity(0.4)),
      prefixIcon: prefixIcon,
      filled: true,
      // Theme-aware: light grey panel in light mode, elevated dark surface in
      // dark mode so the white-on-dark typed text stays legible.
      fillColor: fillColor ?? scheme.surfaceDim,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: borderSide ?? BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: borderSide ?? BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: borderSide ?? const BorderSide(color: Color(0xFF8D5332), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final form = context.watch<ReportFormProvider>();
    final busy = form.state == ReportSubmitState.submitting;
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
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: Dimens.lg, vertical: Dimens.sm),
            children: [
              Text(
                'Report Missing Person',
                style: text.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 26,
                  color: scheme.onSurface,
                ),
              ),
              const SizedBox(height: Dimens.sm),
              Text(
                'Please provide as much accurate information as possible. Fields marked with * are required.',
                style: text.bodyMedium?.copyWith(color: scheme.onSurface.withOpacity(0.6), fontSize: 13),
              ),
              const SizedBox(height: Dimens.lg),

              // Main content card wrapper
              Container(
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: scheme.outlineVariant),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section: Recent Photo
                    Text('Recent Photo', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: Dimens.md),
                    Center(
                      child: GestureDetector(
                        onTap: () => _pickPhoto(form),
                        child: CustomPaint(
                          painter: form.photoPath == null
                              ? DashedBorderPainter(color: scheme.primary, strokeWidth: 1.2, gap: 8)
                              : null,
                          child: Container(
                            width: double.infinity,
                            height: 150,
                            decoration: BoxDecoration(
                              color: scheme.surfaceDim,
                              borderRadius: BorderRadius.circular(12),
                              image: form.photoPath != null
                                  ? DecorationImage(
                                      image: FileImage(File(form.photoPath!)),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: form.photoPath != null
                                ? null
                                : Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.camera_alt_outlined, color: scheme.onSurface.withOpacity(0.6), size: 28),
                                      const SizedBox(height: Dimens.sm),
                                      Text(
                                        'Tap to Upload Photo *',
                                        style: text.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Clear, recent face photo preferred',
                                        style: text.bodySmall?.copyWith(color: Colors.grey),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      ),
                    ),
                    Divider(color: Colors.grey.shade200, height: 40),

                    // Section: Basic Details
                    Text('Basic Details', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: Dimens.md),
                    Text('Full Name *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _name,
                      textCapitalization: TextCapitalization.words,
                      validator: (v) => Validators.required(v, field: 'Name'),
                      decoration: _inputDecoration(hintText: 'Jane Doe'),
                    ),
                    const SizedBox(height: Dimens.md),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Age *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _age,
                                keyboardType: TextInputType.number,
                                validator: Validators.age,
                                decoration: _inputDecoration(hintText: 'e.g. 34'),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: Dimens.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Gender *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                value: _gender,
                                decoration: _inputDecoration(hintText: 'Select'),
                                items: const [
                                  DropdownMenuItem(value: 'M', child: Text('Male')),
                                  DropdownMenuItem(value: 'F', child: Text('Female')),
                                  DropdownMenuItem(value: 'Other', child: Text('Other')),
                                ],
                                onChanged: (v) => setState(() => _gender = v),
                                validator: (v) => Validators.required(v, field: 'Gender'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Divider(color: Colors.grey.shade200, height: 40),

                    // Section: Appearance
                    Text('Appearance', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: Dimens.md),
                    Text('Physical Description *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _features,
                      maxLines: 3,
                      validator: (v) => Validators.required(v, field: 'Physical description'),
                      decoration: _inputDecoration(
                        hintText: 'Height, weight, eye color, hair color, distinguishing marks (tattoos, scars)...',
                      ),
                    ),
                    const SizedBox(height: Dimens.md),
                    Row(
                      children: [
                        const Icon(Icons.check_circle_outline, color: Colors.redAccent, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'Last Known Clothing *',
                          style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _clothing,
                      maxLines: 2,
                      validator: (v) => Validators.required(v, field: 'Clothing description'),
                      decoration: _inputDecoration(
                        hintText: 'CRITICAL: Describe exactly what they were wearing...',
                        fillColor: scheme.error.withOpacity(0.08), // Theme-aware warning bg
                        borderSide: BorderSide(color: scheme.error.withOpacity(0.4), width: 1),
                      ),
                    ),
                    Divider(color: Colors.grey.shade200, height: 40),

                    // Section: Last Seen Information
                    Text('Last Seen Information', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: Dimens.md),
                    Text('Date *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _date,
                      readOnly: true,
                      onTap: _selectDate,
                      validator: (v) => Validators.required(v, field: 'Date'),
                      decoration: _inputDecoration(hintText: 'mm/dd/yyyy'),
                    ),
                    const SizedBox(height: Dimens.md),
                    Text('Time *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _time,
                      readOnly: true,
                      onTap: _selectTime,
                      validator: (v) => Validators.required(v, field: 'Time'),
                      decoration: _inputDecoration(hintText: '--:--'),
                    ),
                    const SizedBox(height: Dimens.md),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Location *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                        GestureDetector(
                          onTap: () => _autoDetectLocation(form),
                          child: const Row(
                            children: [
                              Icon(Icons.gps_fixed, color: Color(0xFFB06F43), size: 14),
                              SizedBox(width: 4),
                              Text(
                                'Auto-detect',
                                style: TextStyle(color: Color(0xFFB06F43), fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _locationAddress,
                      validator: (v) => Validators.required(v, field: 'Location'),
                      decoration: _inputDecoration(
                        hintText: 'Address, landmark, or intersection',
                        prefixIcon: Icon(Icons.location_on_outlined, color: scheme.onSurface.withOpacity(0.6)),
                      ),
                    ),
                    const SizedBox(height: Dimens.md),
                    // Map preview visual card
                    GestureDetector(
                      onTap: () => _autoDetectLocation(form),
                      child: Container(
                        height: 120,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2EFE9), // soft light green/teal map background
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            const Icon(
                              Icons.location_pin,
                              color: Color(0xFFD27D56),
                              size: 44,
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: scheme.surface,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: scheme.outlineVariant, width: 1),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.map_outlined, size: 16, color: scheme.onSurface),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Tap to open map',
                                    style: TextStyle(color: scheme.onSurface, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Divider(color: scheme.outlineVariant, height: 40),

                    // Section: Additional Context
                    Text('Additional Context', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: Dimens.md),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: scheme.surfaceDim,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: scheme.outlineVariant),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Checkbox(
                            value: _hasMedicalConditions,
                            activeColor: scheme.primary,
                            onChanged: (v) {
                              setState(() {
                                _hasMedicalConditions = v ?? false;
                              });
                            },
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 10),
                                Text(
                                  'Medical Conditions / Special Needs',
                                  style: text.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Check this box if the person requires medication, has dementia, autism, or other conditions searchers should be aware of.',
                                  style: text.bodySmall?.copyWith(color: Colors.grey.shade600, height: 1.3),
                                ),
                                const SizedBox(height: 10),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_hasMedicalConditions) ...[
                      const SizedBox(height: Dimens.md),
                      TextFormField(
                        controller: _medicalConditions,
                        maxLines: 2,
                        validator: (v) => _hasMedicalConditions
                            ? Validators.required(v, field: 'Medical conditions')
                            : null,
                        decoration: _inputDecoration(
                          hintText: 'Describe medical conditions, medications, or special needs...',
                        ),
                      ),
                    ],
                    Divider(color: Colors.grey.shade200, height: 40),

                    // Section: Your Contact Info
                    Text('Your Contact Info', style: text.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: Dimens.md),
                    Text('Relationship to Person *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _relationship,
                      decoration: _inputDecoration(hintText: 'Select Relationship'),
                      items: const [
                        DropdownMenuItem(value: 'Parent', child: Text('Parent')),
                        DropdownMenuItem(value: 'Sibling', child: Text('Sibling')),
                        DropdownMenuItem(value: 'Spouse', child: Text('Spouse')),
                        DropdownMenuItem(value: 'Child', child: Text('Child')),
                        DropdownMenuItem(value: 'Friend', child: Text('Friend')),
                        DropdownMenuItem(value: 'Guardian', child: Text('Guardian')),
                        DropdownMenuItem(value: 'Other', child: Text('Other')),
                      ],
                      onChanged: (v) => setState(() => _relationship = v),
                      validator: (v) => Validators.required(v, field: 'Relationship'),
                    ),
                    const SizedBox(height: Dimens.md),
                    Text('Your Phone Number *', style: text.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _reporterPhone,
                      keyboardType: TextInputType.phone,
                      validator: Validators.phone,
                      decoration: _inputDecoration(hintText: '(555) 123-4567'),
                    ),
                    const SizedBox(height: Dimens.xl),

                    // Submit Button: Post Alert
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        onPressed: busy ? null : () => _submit(form),
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
                                  Icon(Icons.campaign_outlined, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text(
                                    'Post Alert',
                                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: Dimens.sm),
                    Center(
                      child: Text(
                        'By posting, you confirm you have authority to share this information and have already contacted local authorities.',
                        textAlign: TextAlign.center,
                        style: text.bodySmall?.copyWith(color: Colors.grey.shade500, fontSize: 11, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Dimens.xl),
            ],
          ),
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
