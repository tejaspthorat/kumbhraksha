import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/validators.dart';
import '../../../../models/enums.dart';
import '../../../../models/family_group.dart';
import '../../../../providers/family_provider.dart';

/// Add or edit a family member (photo + identity pre-fill).
class AddFamilyMemberScreen extends StatefulWidget {
  const AddFamilyMemberScreen({super.key, this.existing});
  static const String route = '/family/add';

  final FamilyMember? existing;

  @override
  State<AddFamilyMemberScreen> createState() => _AddFamilyMemberScreenState();
}

class _AddFamilyMemberScreenState extends State<AddFamilyMemberScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _age;
  late final TextEditingController _phone;
  String _gender = 'M';
  String? _photoPath;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: e?.name ?? '');
    _age = TextEditingController(text: e?.age?.toString() ?? '');
    _phone = TextEditingController(text: e?.phoneNumber ?? '');
    _gender = e?.gender ?? 'M';
    _photoPath = e?.photoUrl;
  }

  @override
  void dispose() {
    _name.dispose();
    _age.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final file = await ImagePicker().pickImage(
        source: ImageSource.gallery, maxWidth: 1024, imageQuality: 80);
    if (file != null) setState(() => _photoPath = file.path);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await context.read<FamilyProvider>().save(
          id: widget.existing?.id,
          name: _name.text,
          age: int.tryParse(_age.text),
          gender: _gender,
          phoneNumber: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
          photoUrl: _photoPath,
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
          title: Text(widget.existing == null ? 'Add member' : 'Edit member')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(Dimens.lg),
            children: [
              Center(
                child: GestureDetector(
                  onTap: _pickPhoto,
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: scheme.surfaceContainerHighest,
                    backgroundImage:
                        (_photoPath != null && File(_photoPath!).existsSync())
                            ? FileImage(File(_photoPath!))
                            : null,
                    child: _photoPath == null
                        ? const Icon(Icons.add_a_photo_outlined, size: 28)
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: Dimens.xl),
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
                      decoration: const InputDecoration(labelText: 'Age'),
                    ),
                  ),
                  const SizedBox(width: Dimens.md),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _gender,
                      decoration: const InputDecoration(labelText: 'Gender'),
                      items: genders
                          .map((g) =>
                              DropdownMenuItem(value: g, child: Text(g)))
                          .toList(),
                      onChanged: (v) => setState(() => _gender = v ?? 'M'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Dimens.md),
              TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone (optional)',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: Dimens.xl),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Save member'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
