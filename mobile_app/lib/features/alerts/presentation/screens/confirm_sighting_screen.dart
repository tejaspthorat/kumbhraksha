import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/witness_alert.dart';
import '../../../../providers/alerts_feed_provider.dart';

/// "I See Them" — capture a live sighting with photo, confidence and location.
class ConfirmSightingScreen extends StatefulWidget {
  const ConfirmSightingScreen({super.key, required this.alert});
  static const String route = '/sighting/confirm';

  final WitnessAlert alert;

  @override
  State<ConfirmSightingScreen> createState() => _ConfirmSightingScreenState();
}

class _ConfirmSightingScreenState extends State<ConfirmSightingScreen> {
  String _personType = 'child';
  String _gender = 'M';
  String _behavior = 'wandering';
  String? _photoPath;
  double _confidence = 0.7;
  bool _shareLocation = true;
  final _notes = TextEditingController();
  bool _submitting = false;

  static const _behaviors = [
    'wandering', 'crying', 'confused', 'sitting', 'with someone', 'other',
  ];

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

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
            personType: _personType,
            gender: _gender,
            behavior: _behavior,
            photoPath: _photoPath,
            notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
            shareLocation: _shareLocation,
            confidence: _confidence,
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

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('I see them')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(Dimens.lg),
          children: [
            Text(widget.alert.personName ?? 'Reported person',
                style: text.titleMedium),
            const SizedBox(height: Dimens.lg),
            Center(
              child: GestureDetector(
                onTap: _pickPhoto,
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    color: scheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(Dimens.radiusCard),
                    image: _photoPath != null
                        ? DecorationImage(
                            image: FileImage(File(_photoPath!)),
                            fit: BoxFit.cover)
                        : null,
                  ),
                  child: _photoPath != null
                      ? null
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt_outlined,
                                color: scheme.primary),
                            const SizedBox(height: Dimens.xs),
                            Text('Photo of person', style: text.bodySmall),
                          ],
                        ),
                ),
              ),
            ),
            const SizedBox(height: Dimens.xl),
            Row(children: [
              Expanded(
                child: _dropdown('Who', const ['child', 'adult', 'elderly'],
                    _personType, (v) => setState(() => _personType = v!)),
              ),
              const SizedBox(width: Dimens.md),
              Expanded(
                child: _dropdown('Gender', const ['M', 'F', 'Other'], _gender,
                    (v) => setState(() => _gender = v!)),
              ),
            ]),
            const SizedBox(height: Dimens.md),
            _dropdown('Behaviour', _behaviors, _behavior,
                (v) => setState(() => _behavior = v!)),
            const SizedBox(height: Dimens.lg),
            Text('How sure are you?', style: text.titleSmall),
            Slider(
              value: _confidence,
              onChanged: (v) => setState(() => _confidence = v),
              divisions: 10,
              label: '${(_confidence * 100).round()}%',
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Share my current location'),
              value: _shareLocation,
              onChanged: (v) => setState(() => _shareLocation = v),
            ),
            const SizedBox(height: Dimens.md),
            TextField(
              controller: _notes,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                hintText: 'Anything that could help…',
              ),
            ),
            const SizedBox(height: Dimens.xl),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Share sighting'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dropdown(String label, List<String> items, String value,
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
