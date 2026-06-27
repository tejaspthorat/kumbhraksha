import 'dart:io';

import 'package:flutter/material.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/family_group.dart';

/// List card for a pre-registered family member with quick-report / edit / delete.
class FamilyMemberCard extends StatelessWidget {
  const FamilyMemberCard({
    super.key,
    required this.member,
    this.onQuickReport,
    this.onEdit,
    this.onDelete,
  });

  final FamilyMember member;
  final VoidCallback? onQuickReport;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final photo = member.photoUrl;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(Dimens.md),
        child: Row(
          children: [
            CircleAvatar(
              radius: 26,
              backgroundColor: scheme.surfaceContainerHighest,
              backgroundImage: (photo != null && File(photo).existsSync())
                  ? FileImage(File(photo))
                  : null,
              child: (photo == null) ? const Icon(Icons.person) : null,
            ),
            const SizedBox(width: Dimens.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(member.name, style: text.titleMedium),
                  Text(
                    [
                      if (member.age != null) '${member.age} yrs',
                      if (member.gender != null) member.gender!,
                    ].join(' • '),
                    style: text.bodySmall,
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              onSelected: (v) {
                if (v == 'edit') onEdit?.call();
                if (v == 'delete') onDelete?.call();
              },
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'edit', child: Text('Edit')),
                PopupMenuItem(value: 'delete', child: Text('Delete')),
              ],
            ),
            FilledButton.tonal(
              onPressed: onQuickReport,
              child: const Text('Report'),
            ),
          ],
        ),
      ),
    );
  }
}
