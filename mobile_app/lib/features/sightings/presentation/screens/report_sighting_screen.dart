import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../providers/sighting_provider.dart';

/// Proactive "Report a sighting" — citizen reports someone who looks lost.
class ReportSightingScreen extends StatefulWidget {
  const ReportSightingScreen({super.key});
  static const String route = '/sighting/report';

  @override
  State<ReportSightingScreen> createState() => _ReportSightingScreenState();
}

class _ReportSightingScreenState extends State<ReportSightingScreen> {
  final _notes = TextEditingController();
  final _age = TextEditingController();

  static const _types = [
    ('child', Icons.child_care, 'Child'),
    ('adult', Icons.person, 'Adult'),
    ('elderly', Icons.elderly, 'Elderly'),
  ];
  static const _behaviors = [
    ('crying', '😢', 'Crying'),
    ('confused', '😕', 'Confused'),
    ('wandering', '🚶', 'Wandering'),
    ('sitting', '🧎', 'Sitting alone'),
    ('with someone', '👥', 'With someone'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<SightingProvider>().captureLocation());
  }

  @override
  void dispose() {
    _notes.dispose();
    _age.dispose();
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
      approxAge: int.tryParse(_age.text),
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
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(Dimens.radiusSheet)),
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

  @override
  Widget build(BuildContext context) {
    final p = context.watch<SightingProvider>();
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final busy = p.state == SightingSubmitState.submitting;

    return Scaffold(
      appBar: AppBar(title: const Text('Report a sighting')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(Dimens.lg),
          children: [
            Text('Someone who looks lost?', style: text.titleMedium),
            const SizedBox(height: Dimens.xs),
            Text('A quick report can reunite a family.', style: text.bodySmall),
            const SizedBox(height: Dimens.lg),
            Center(
              child: GestureDetector(
                onTap: () => _pickPhoto(p),
                child: Container(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    color: scheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(Dimens.radiusCard),
                    image: p.photoPath != null
                        ? DecorationImage(
                            image: FileImage(File(p.photoPath!)),
                            fit: BoxFit.cover)
                        : null,
                  ),
                  child: p.photoPath != null
                      ? null
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_outlined,
                                color: scheme.primary),
                            const SizedBox(height: Dimens.xs),
                            Text('Add photo', style: text.bodySmall),
                          ],
                        ),
                ),
              ),
            ),
            const SizedBox(height: Dimens.xl),
            Text('Who is it?', style: text.titleSmall),
            const SizedBox(height: Dimens.sm),
            Row(
              children: _types.map((t) {
                final selected = p.personType == t.$1;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: Dimens.sm),
                    child: _ChoiceTile(
                      icon: t.$2,
                      label: t.$3,
                      selected: selected,
                      onTap: () => p.update(personType: t.$1),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: Dimens.lg),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _age,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Approx age'),
                  ),
                ),
                const SizedBox(width: Dimens.md),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: p.gender,
                    decoration: const InputDecoration(labelText: 'Gender'),
                    items: const ['M', 'F', 'Other']
                        .map((e) =>
                            DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                    onChanged: (v) => p.update(gender: v),
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimens.lg),
            Text('How are they behaving?', style: text.titleSmall),
            const SizedBox(height: Dimens.sm),
            Wrap(
              spacing: Dimens.sm,
              runSpacing: Dimens.sm,
              children: _behaviors.map((b) {
                final selected = p.behavior == b.$1;
                return ChoiceChip(
                  label: Text('${b.$2}  ${b.$3}'),
                  selected: selected,
                  onSelected: (_) => p.update(behavior: b.$1),
                );
              }).toList(),
            ),
            const SizedBox(height: Dimens.lg),
            _LocationTile(provider: p),
            const SizedBox(height: Dimens.md),
            TextField(
              controller: _notes,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                hintText: 'Landmarks, who they are with…',
              ),
            ),
            const SizedBox(height: Dimens.md),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              secondary: const Icon(Icons.share_location),
              title: const Text("I'll guide them to help"),
              subtitle: const Text('Share my live location with authorities'),
              value: p.guideToHelp,
              onChanged: (v) => p.update(guideToHelp: v),
            ),
            const SizedBox(height: Dimens.xl),
            FilledButton(
              onPressed: busy ? null : () => _submit(p),
              child: busy
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Submit sighting'),
            ),
            const SizedBox(height: Dimens.lg),
          ],
        ),
      ),
    );
  }
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(Dimens.radiusCard),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: Dimens.lg),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Dimens.radiusCard),
          border: Border.all(
            color: selected ? scheme.primary : scheme.outlineVariant,
            width: selected ? 2 : 1,
          ),
          color: selected ? scheme.primary.withValues(alpha: 0.06) : null,
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? scheme.primary : scheme.outline),
            const SizedBox(height: Dimens.xs),
            Text(label, style: Theme.of(context).textTheme.labelMedium),
          ],
        ),
      ),
    );
  }
}

class _LocationTile extends StatelessWidget {
  const _LocationTile({required this.provider});
  final SightingProvider provider;

  @override
  Widget build(BuildContext context) {
    final has = provider.latitude != null;
    return Card(
      child: ListTile(
        leading: Icon(Icons.my_location,
            color: Theme.of(context).colorScheme.primary),
        title: Text(has ? 'Location detected' : 'Detecting location…'),
        subtitle: has
            ? Text('${provider.latitude!.toStringAsFixed(4)}, '
                '${provider.longitude!.toStringAsFixed(4)}')
            : const Text('Tap refresh if it does not appear'),
        trailing: IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: provider.captureLocation,
        ),
      ),
    );
  }
}
