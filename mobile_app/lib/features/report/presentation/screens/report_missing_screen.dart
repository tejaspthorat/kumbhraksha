import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/validators.dart';
import '../../../../models/enums.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/report_form_provider.dart';

/// Full missing-person report form.
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

  @override
  void dispose() {
    _name.dispose();
    _age.dispose();
    _features.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ReportFormProvider form) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
        source: ImageSource.camera, maxWidth: 1024, imageQuality: 80);
    if (file != null) form.update(photoPath: file.path);
  }

  Future<void> _pickTime(ReportFormProvider form) async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(form.lastSeenTime),
    );
    if (time != null) {
      final now = DateTime.now();
      form.update(
        lastSeenTime:
            DateTime(now.year, now.month, now.day, time.hour, time.minute),
      );
    }
  }

  Future<void> _submit(ReportFormProvider form) async {
    if (!_formKey.currentState!.validate()) return;
    form.update(
      personName: _name.text,
      personAge: int.tryParse(_age.text),
      distinguishingFeatures: _features.text,
    );
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

  @override
  Widget build(BuildContext context) {
    final form = context.watch<ReportFormProvider>();
    final busy = form.state == ReportSubmitState.submitting;
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Report missing person')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(Dimens.lg),
            children: [
              Center(child: _PhotoPicker(form: form, onTap: () => _pickPhoto(form))),
              const SizedBox(height: Dimens.xl),
              Text('Who is missing?', style: text.titleMedium),
              const SizedBox(height: Dimens.md),
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                validator: (v) => Validators.required(v, field: 'Name'),
                decoration: const InputDecoration(
                  labelText: 'Full name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: Dimens.md),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _age,
                      keyboardType: TextInputType.number,
                      validator: Validators.age,
                      decoration: const InputDecoration(labelText: 'Age'),
                    ),
                  ),
                  const SizedBox(width: Dimens.md),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: form.personGender,
                      decoration: const InputDecoration(labelText: 'Gender'),
                      items: genders
                          .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                          .toList(),
                      onChanged: (v) => form.update(personGender: v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Dimens.xl),
              Text('Appearance', style: text.titleMedium),
              const SizedBox(height: Dimens.md),
              _ClothingSelector(form: form),
              const SizedBox(height: Dimens.md),
              DropdownButtonFormField<String>(
                initialValue: form.build,
                decoration: const InputDecoration(labelText: 'Build'),
                items: buildTypes
                    .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                    .toList(),
                onChanged: (v) => form.update(build: v),
              ),
              const SizedBox(height: Dimens.md),
              TextFormField(
                controller: _features,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Distinguishing features (optional)',
                  hintText: 'Birthmark, glasses, jewellery…',
                ),
              ),
              const SizedBox(height: Dimens.xl),
              Text('Last seen', style: text.titleMedium),
              const SizedBox(height: Dimens.md),
              _LocationRow(form: form),
              const SizedBox(height: Dimens.sm),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.access_time),
                title: const Text('Time last seen'),
                subtitle: Text(DateFormat.jm().format(form.lastSeenTime)),
                trailing: TextButton(
                  onPressed: () => _pickTime(form),
                  child: const Text('Change'),
                ),
              ),
              const SizedBox(height: Dimens.xl),
              FilledButton(
                onPressed: busy ? null : () => _submit(form),
                child: busy
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit report'),
              ),
              const SizedBox(height: Dimens.lg),
            ],
          ),
        ),
      ),
    );
  }
}

class _PhotoPicker extends StatelessWidget {
  const _PhotoPicker({required this.form, required this.onTap});
  final ReportFormProvider form;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final hasPhoto = form.photoPath != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(Dimens.radiusCard),
          image: hasPhoto
              ? DecorationImage(
                  image: FileImage(File(form.photoPath!)), fit: BoxFit.cover)
              : null,
        ),
        child: hasPhoto
            ? null
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_a_photo_outlined, color: scheme.primary),
                  const SizedBox(height: Dimens.xs),
                  Text('Add photo',
                      style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
      ),
    );
  }
}

class _ClothingSelector extends StatelessWidget {
  const _ClothingSelector({required this.form});
  final ReportFormProvider form;

  @override
  Widget build(BuildContext context) {
    final c = form.clothing;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _dropdown('Top colour', clothingColors, c.topColor,
                  (v) => form.updateClothing(c.copyWith(topColor: v))),
            ),
            const SizedBox(width: Dimens.md),
            Expanded(
              child: _dropdown('Top type', topTypes, c.topType,
                  (v) => form.updateClothing(c.copyWith(topType: v))),
            ),
          ],
        ),
        const SizedBox(height: Dimens.md),
        Row(
          children: [
            Expanded(
              child: _dropdown('Bottom colour', clothingColors, c.bottomColor,
                  (v) => form.updateClothing(c.copyWith(bottomColor: v))),
            ),
            const SizedBox(width: Dimens.md),
            Expanded(
              child: _dropdown('Bottom type', bottomTypes, c.bottomType,
                  (v) => form.updateClothing(c.copyWith(bottomType: v))),
            ),
          ],
        ),
        const SizedBox(height: Dimens.md),
        _dropdown('Footwear', footwearTypes, c.footwear,
            (v) => form.updateClothing(c.copyWith(footwear: v))),
      ],
    );
  }

  Widget _dropdown(String label, List<String> items, String? value,
      ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: items
          .map((e) => DropdownMenuItem(value: e, child: Text(e)))
          .toList(),
      onChanged: onChanged,
    );
  }
}

class _LocationRow extends StatelessWidget {
  const _LocationRow({required this.form});
  final ReportFormProvider form;

  @override
  Widget build(BuildContext context) {
    final has = form.lastSeenLatitude != null;
    return Card(
      child: ListTile(
        leading: Icon(Icons.location_on,
            color: Theme.of(context).colorScheme.primary),
        title: Text(has ? 'Current location captured' : 'Use current location'),
        subtitle: has
            ? Text(
                '${form.lastSeenLatitude!.toStringAsFixed(4)}, '
                '${form.lastSeenLongitude!.toStringAsFixed(4)}')
            : const Text('Tag where they were last seen'),
        trailing: TextButton(
          onPressed: form.captureCurrentLocation,
          child: Text(has ? 'Update' : 'Capture'),
        ),
      ),
    );
  }
}
