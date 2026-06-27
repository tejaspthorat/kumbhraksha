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
    final text = Theme.of(context).textTheme;
    final busy = auth.status == AuthStatus.authenticating;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Dimens.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Enter the code', style: text.headlineSmall),
              const SizedBox(height: Dimens.xs),
              Text('Sent to ${auth.phoneNumber}', style: text.bodyMedium),
              const SizedBox(height: Dimens.xs),
              Text('Demo code: ${AuthRepository.mockOtp}',
                  style: text.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.secondary)),
              const SizedBox(height: Dimens.xl),
              TextField(
                controller: _controller,
                keyboardType: TextInputType.number,
                autofocus: true,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: text.headlineMedium,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  counterText: '',
                  hintText: '••••••',
                ),
                onChanged: (v) {
                  if (v.length == 6 && !busy) _verify();
                },
              ),
              const SizedBox(height: Dimens.lg),
              Row(
                children: [
                  Text('Did not get the code? ', style: text.bodySmall),
                  if (_seconds > 0)
                    Text('Resend in ${_seconds}s', style: text.bodySmall)
                  else
                    TextButton(
                      onPressed: () {
                        context.read<AuthProvider>().requestOtp();
                        _startCountdown();
                      },
                      child: const Text('Resend'),
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
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Verify'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
