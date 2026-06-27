import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../repositories/auth_repository.dart';
import '../../../../screens/nav_shell.dart';

/// Onboarding step 4 — OTP entry with resend countdown. Auto-submits at 6 digits.
class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});
  static const String route = '/onboarding/otp';

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _controller = TextEditingController();
  Timer? _timer;
  int _seconds = 30;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _seconds = 30;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_seconds == 0) {
        t.cancel();
      } else {
        setState(() => _seconds--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.verifyOtp(_controller.text.trim());
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pushNamedAndRemoveUntil(NavShell.route, (_) => false);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.errorMessage ?? 'Verification failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final scheme = theme.colorScheme;
    final busy = auth.status == AuthStatus.authenticating;

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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Dimens.md),
              Text(
                'Enter verification code',
                style: text.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: Dimens.xs),
              Text(
                'Sent to ${auth.phoneNumber}',
                style: text.bodyLarge?.copyWith(
                  color: scheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: Dimens.xs),
              Row(
                children: [
                  Text(
                    'Demo code: ',
                    style: text.bodySmall?.copyWith(color: scheme.onSurface.withOpacity(0.4)),
                  ),
                  Text(
                    AuthRepository.mockOtp,
                    style: text.bodySmall?.copyWith(
                      color: scheme.secondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Dimens.xxl),
              
              // Stylized 6-digit pin block layout
              Stack(
                alignment: Alignment.center,
                children: [
                  Opacity(
                    opacity: 0,
                    child: TextField(
                      controller: _controller,
                      keyboardType: TextInputType.number,
                      autofocus: true,
                      maxLength: 6,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      onChanged: (v) {
                        setState(() {});
                        if (v.length == 6 && !busy) _verify();
                      },
                    ),
                  ),
                  IgnorePointer(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) {
                        final textVal = _controller.text;
                        final char = index < textVal.length ? textVal[index] : '';
                        final isFocused = textVal.length == index;
                        return Container(
                          width: 46,
                          height: 52,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isFocused ? scheme.surface : scheme.surfaceDim,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isFocused ? scheme.primary : scheme.outlineVariant,
                              width: isFocused ? 2 : 1,
                            ),
                            boxShadow: isFocused
                                ? [
                                    BoxShadow(
                                      color: scheme.primary.withOpacity(0.08),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    )
                                  ]
                                : null,
                          ),
                          child: Text(
                            char.isNotEmpty ? char : '•',
                            style: text.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: char.isNotEmpty ? scheme.onSurface : scheme.onSurface.withOpacity(0.2),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: Dimens.xl),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Did not get the code? ',
                    style: text.bodyMedium?.copyWith(color: scheme.onSurface.withOpacity(0.6)),
                  ),
                  if (_seconds > 0)
                    Text(
                      'Resend in ${_seconds}s',
                      style: text.bodyMedium?.copyWith(
                        color: scheme.onSurface.withOpacity(0.8),
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  else
                    TextButton(
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: () {
                        context.read<AuthProvider>().requestOtp();
                        _startCountdown();
                      },
                      child: Text(
                        'Resend',
                        style: TextStyle(
                          color: scheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              const Spacer(),
              FilledButton(
                onPressed: busy ? null : _verify,
                child: busy
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Verify and login'),
              ),
              const SizedBox(height: Dimens.md),
            ],
          ),
        ),
      ),
    );
  }
}
