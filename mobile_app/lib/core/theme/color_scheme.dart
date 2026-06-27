import 'package:flutter/material.dart';

/// KumbhRaksha tactical brand colors and accents from DESIGN.md.
class AppColors {
  AppColors._();

  // Mode-Independent Accents
  static const Color accentOrange = Color(0xFFFF801F);
  static const Color accentYellow = Color(0xFFFFC53D);
  static const Color accentBlue = Color(0xFF3B9EFF);
  static const Color accentGreen = Color(0xFF11FF99);
  static const Color accentRed = Color(0xFFFF2047);

  // Neutrals for direct access
  static const Color transparent = Colors.transparent;
}

final ColorScheme lightColorScheme = const ColorScheme.light().copyWith(
  primary: Colors.black,
  onPrimary: Colors.white,
  secondary: AppColors.accentBlue,
  onSecondary: Colors.white,
  tertiary: AppColors.accentGreen,
  onTertiary: Colors.black,
  error: AppColors.accentRed,
  onError: Colors.white,
  surface: Colors.white,
  onSurface: Color(0xDB000000), // 86% black
  outlineVariant: Color(0x0F000000), // 6% black hairline border
  outline: Color(0x1F000000), // 12% black stronger hairline border
  surfaceContainerHighest: Color(0xFFF9F9FB), // surface-card
  surfaceDim: Color(0xFFF2F2F7), // surface-elevated
);

final ColorScheme darkColorScheme = const ColorScheme.dark().copyWith(
  primary: Color(0xFFFCFDFF),
  onPrimary: Colors.black,
  secondary: AppColors.accentBlue,
  onSecondary: Colors.white,
  tertiary: AppColors.accentGreen,
  onTertiary: Colors.black,
  error: AppColors.accentRed,
  onError: Colors.white,
  surface: Colors.black, // True Black
  onSurface: Color(0xDBFCFDFF), // 86% white/silver
  outlineVariant: Color(0x0FFFFFFF), // 6% white hairline border
  outline: Color(0x24FFFFFF), // 14% white stronger hairline border
  surfaceContainerHighest: Color(0xFF0A0A0C), // surface-card
  surfaceDim: Color(0xFF101012), // surface-elevated
);
