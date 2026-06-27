import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/validators.dart';
import '../../../../providers/auth_provider.dart';
import 'otp_verification_screen.dart';

/// Onboarding step 3 — phone number entry.
class PhoneInputScreen extends StatefulWidget {
  const PhoneInputScreen({super.key});
  static const String route = '/onboarding/phone';

  @override
  State<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends State<PhoneInputScreen> {
  final _formKey = GlobalKey<FormState>();
  final _controller = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _sending = true);
    final auth = context.read<AuthProvider>();
    auth.setPhone('+91${_controller.text.trim()}');
    await auth.requestOtp();
    if (!mounted) return;
    setState(() => _sending = false);
    Navigator.of(context).pushNamed(OtpVerificationScreen.route);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimens.lg),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your phone number', style: text.headlineSmall),
                const SizedBox(height: Dimens.xs),
                Text('We will send a one-time code to verify it.',
                    style: text.bodyMedium),
                const SizedBox(height: Dimens.xl),
                TextFormField(
                  controller: _controller,
                  keyboardType: TextInputType.phone,
                  autofocus: true,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: Validators.phone,
                  decoration: const InputDecoration(
                    prefixText: '+91  ',
                    labelText: 'Mobile number',
                    hintText: '98765 43210',
                    prefixIcon: Icon(Icons.phone),
                  ),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: _sending ? null : _submit,
                  child: _sending
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Send code'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
