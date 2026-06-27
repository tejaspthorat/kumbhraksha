import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/witness_alert.dart';
import '../../../../providers/alerts_feed_provider.dart';

/// "I Was There" — recall when/where the user saw the person and which way they
/// were heading, to strengthen the search.
class WitnessMemoryScreen extends StatefulWidget {
  const WitnessMemoryScreen({super.key, required this.alert});
  static const String route = '/witness/memory';

  final WitnessAlert alert;

  @override
  State<WitnessMemoryScreen> createState() => _WitnessMemoryScreenState();
}

class _WitnessMemoryScreenState extends State<WitnessMemoryScreen> {
  DateTime _seenAt = DateTime.now().subtract(const Duration(minutes: 15));
  String? _direction;
  final _notes = TextEditingController();
  bool _submitting = false;

  static const _directions = [
    'North', 'South', 'East', 'West', 'Towards river', 'Towards gate', 'Unsure',
  ];

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickTime() async {
    final t = await showTimePicker(
        context: context, initialTime: TimeOfDay.fromDateTime(_seenAt));
    if (t != null) {
      final now = DateTime.now();
      setState(() =>
          _seenAt = DateTime(now.year, now.month, now.day, t.hour, t.minute));
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await context.read<AlertsFeedProvider>().submitWitnessMemory(
            alert: widget.alert,
            seenAt: _seenAt,
            direction: _direction,
            notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thank you. Your memory was added.')),
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
    return Scaffold(
      appBar: AppBar(title: const Text('I was there')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(Dimens.lg),
          children: [
            Text('Help us retrace ${widget.alert.personName ?? "this person"}',
                style: text.titleMedium),
            const SizedBox(height: Dimens.xs),
            Text('Even small details help narrow the search.',
                style: text.bodySmall),
            const SizedBox(height: Dimens.xl),
            Card(
              child: ListTile(
                leading: const Icon(Icons.access_time),
                title: const Text('When did you see them?'),
                subtitle: Text(DateFormat.jm().format(_seenAt)),
                trailing: TextButton(
                    onPressed: _pickTime, child: const Text('Change')),
              ),
            ),
            const SizedBox(height: Dimens.md),
            DropdownButtonFormField<String>(
              initialValue: _direction,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Which way were they heading?',
                prefixIcon: Icon(Icons.explore_outlined),
              ),
              items: _directions
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (v) => setState(() => _direction = v),
            ),
            const SizedBox(height: Dimens.md),
            TextField(
              controller: _notes,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Anything else you remember?',
                hintText: 'Who they were with, what they carried…',
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
                  : const Text('Submit memory'),
            ),
          ],
        ),
      ),
    );
  }
}
