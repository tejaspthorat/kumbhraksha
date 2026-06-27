import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/family_group.dart';
import '../../../../providers/family_provider.dart';
import '../../../../providers/report_form_provider.dart';
import '../../../report/presentation/screens/report_missing_screen.dart';
import '../widgets/family_member_card.dart';
import 'add_family_member_screen.dart';

/// Family group management — pre-register members for one-tap reporting.
class FamilyGroupScreen extends StatefulWidget {
  const FamilyGroupScreen({super.key});
  static const String route = '/family';

  @override
  State<FamilyGroupScreen> createState() => _FamilyGroupScreenState();
}

class _FamilyGroupScreenState extends State<FamilyGroupScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => context.read<FamilyProvider>().load());
  }

  void _openAdd([FamilyMember? existing]) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => AddFamilyMemberScreen(existing: existing),
    ));
  }

  void _quickReport(FamilyMember m) {
    context.read<ReportFormProvider>().prefillFromFamily(
          name: m.name,
          age: m.age,
          gender: m.gender,
          photoUrl: m.photoUrl,
        );
    Navigator.of(context).pushNamed(ReportMissingScreen.route);
  }

  Future<void> _confirmDelete(FamilyMember m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Remove member?'),
        content: Text('Remove ${m.name} from your family group?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Remove')),
        ],
      ),
    );
    if (ok == true && mounted) {
      await context.read<FamilyProvider>().delete(m.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final family = context.watch<FamilyProvider>();
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Family group')),
      body: family.loading
          ? const Center(child: CircularProgressIndicator())
          : family.members.isEmpty
              ? _Empty(onAdd: _openAdd)
              : ListView(
                  padding: const EdgeInsets.all(Dimens.lg),
                  children: [
                    Text(
                      'Pre-register family so you can report in one tap if '
                      'someone goes missing.',
                      style: text.bodySmall,
                    ),
                    const SizedBox(height: Dimens.lg),
                    ...family.members.map((m) => Padding(
                          padding: const EdgeInsets.only(bottom: Dimens.md),
                          child: FamilyMemberCard(
                            member: m,
                            onQuickReport: () => _quickReport(m),
                            onEdit: () => _openAdd(m),
                            onDelete: () => _confirmDelete(m),
                          ),
                        )),
                  ],
                ),
      floatingActionButton: family.isFull
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _openAdd(),
              icon: const Icon(Icons.person_add_alt),
              label: const Text('Add member'),
            ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.onAdd});
  final void Function([FamilyMember?]) onAdd;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Dimens.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.diversity_3, size: 72, color: scheme.outline),
            const SizedBox(height: Dimens.lg),
            Text('No family members yet', style: text.titleMedium),
            const SizedBox(height: Dimens.xs),
            Text(
              'Add up to 10 members. If one goes missing, reporting is instant.',
              textAlign: TextAlign.center,
              style: text.bodySmall,
            ),
            const SizedBox(height: Dimens.xl),
            FilledButton.icon(
              onPressed: () => onAdd(),
              icon: const Icon(Icons.person_add_alt),
              label: const Text('Add first member'),
            ),
          ],
        ),
      ),
    );
  }
}
