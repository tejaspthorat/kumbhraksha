/// Form validators.
class Validators {
  Validators._();

  /// Indian mobile number: 10 digits starting 6-9, optional +91 prefix.
  static String? phone(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return 'Phone number is required';
    final digits = v.replaceAll(RegExp(r'[^0-9]'), '');
    final local = digits.length > 10 ? digits.substring(digits.length - 10) : digits;
    if (local.length != 10 || !RegExp(r'^[6-9]\d{9}$').hasMatch(local)) {
      return 'Enter a valid 10-digit mobile number';
    }
    return null;
  }

  static String? otp(String? value) {
    final v = (value ?? '').trim();
    if (v.length != 6 || !RegExp(r'^\d{6}$').hasMatch(v)) {
      return 'Enter the 6-digit code';
    }
    return null;
  }

  static String? required(String? value, {String field = 'This field'}) {
    if ((value ?? '').trim().isEmpty) return '$field is required';
    return null;
  }

  static String? age(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return 'Age is required';
    final n = int.tryParse(v);
    if (n == null || n < 0 || n > 120) return 'Enter a valid age';
    return null;
  }
}
