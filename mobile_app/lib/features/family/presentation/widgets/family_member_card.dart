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
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final text = theme.textTheme;
    final photo = member.photoUrl;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant, width: 1),
      ),
      padding: const EdgeInsets.all(Dimens.md),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: scheme.outlineVariant, width: 1.5),
            ),
            child: CircleAvatar(
              radius: 24,
              backgroundColor: scheme.surfaceDim,
              backgroundImage: (photo != null && File(photo).existsSync())
                  ? FileImage(File(photo))
                  : null,
              child: (photo == null)
                  ? Icon(Icons.person_outline_rounded, color: scheme.onSurface.withOpacity(0.4), size: 24)
                  : null,
            ),
          ),
          const SizedBox(width: Dimens.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  member.name,
                  style: text.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: scheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [
                    if (member.age != null) '${member.age} yrs',
                    if (member.gender != null) member.gender!,
                  ].join('  •  '),
                  style: text.bodySmall?.copyWith(
                    color: scheme.onSurface.withOpacity(0.5),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            icon: Icon(Icons.more_vert_rounded, color: scheme.onSurface.withOpacity(0.5)),
            onSelected: (v) {
              if (v == 'edit') onEdit?.call();
              if (v == 'delete') onDelete?.call();
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'edit', child: Text('Edit Member')),
              PopupMenuItem(value: 'delete', child: Text('Remove Member')),
            ],
          ),
          const SizedBox(width: 4),
          SizedBox(
            height: 36,
            child: OutlinedButton(
              onPressed: onQuickReport,
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: scheme.error.withOpacity(0.5), width: 1.2),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                minimumSize: Size.zero,
                shape: const StadiumBorder(),
              ),
              child: Text(
                'Alert',
                style: TextStyle(
                  color: scheme.error,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
