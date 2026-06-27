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
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final scheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Family Group',
          style: text.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: scheme.onSurface,
          ),
        ),
      ),
      body: family.loading
          ? const Center(child: CircularProgressIndicator())
          : family.members.isEmpty
              ? _Empty(onAdd: _openAdd)
              : ListView(
                  padding: const EdgeInsets.symmetric(horizontal: Dimens.xl, vertical: Dimens.lg),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: scheme.secondary.withOpacity(0.04),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: scheme.secondary.withOpacity(0.15), width: 1),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline_rounded, color: scheme.secondary, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Pre-register family members so you can trigger instant missing person alerts in one tap.',
                              style: text.bodyMedium?.copyWith(
                                color: scheme.secondary,
                                fontWeight: FontWeight.w600,
                                height: 1.3,
                              ),
                            ),
                          ),
                        ],
                      ),
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
                    const SizedBox(height: 80),
                  ],
                ),
      floatingActionButton: family.isFull
          ? null
          : FloatingActionButton.extended(
              backgroundColor: scheme.primary,
              foregroundColor: scheme.onPrimary,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              onPressed: () => _openAdd(),
              icon: const Icon(Icons.person_add_alt_1_rounded),
              label: const Text('Add Member', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.onAdd});
  final void Function([FamilyMember?]) onAdd;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final text = theme.textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Dimens.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: scheme.primary.withOpacity(0.04),
                border: Border.all(color: scheme.outlineVariant, width: 1),
              ),
              child: Icon(Icons.group_outlined, size: 36, color: scheme.primary),
            ),
            const SizedBox(height: Dimens.lg),
            Text(
              'No family members yet',
              style: text.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: Dimens.xs),
            Text(
              'Add up to 10 members. If someone goes missing, broadcasting search details is instantaneous.',
              textAlign: TextAlign.center,
              style: text.bodyMedium?.copyWith(
                color: scheme.onSurface.withOpacity(0.5),
                height: 1.35,
              ),
            ),
            const SizedBox(height: Dimens.xl),
            SizedBox(
              width: 180,
              child: FilledButton.icon(
                onPressed: () => onAdd(),
                icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
                label: const Text('Add Member'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
