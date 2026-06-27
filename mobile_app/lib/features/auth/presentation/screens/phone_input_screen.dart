import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../core/utils/app_translations.dart';
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
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final scheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: Dimens.xl, vertical: Dimens.lg),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: Dimens.md),
                Text(
                  context.tr('phone_title'),
                  style: text.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: Dimens.xs),
                Text(
                  context.tr('phone_desc'),
                  style: text.bodyLarge?.copyWith(
                    color: scheme.onSurface.withOpacity(0.6),
                  ),
                ),
                const SizedBox(height: Dimens.xxl),
                TextFormField(
                  controller: _controller,
                  keyboardType: TextInputType.phone,
                  autofocus: true,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: Validators.phone,
                  style: text.bodyLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                  decoration: InputDecoration(
                    prefixText: '+91  ',
                    prefixStyle: text.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: scheme.onSurface.withOpacity(0.4),
                    ),
                    labelText: context.tr('phone_label'),
                    hintText: '98765 43210',
                    prefixIcon: Icon(Icons.phone_iphone_outlined, color: scheme.primary),
                    counterText: '',
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
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(context.tr('send_otp')),
                ),
                const SizedBox(height: Dimens.md),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
