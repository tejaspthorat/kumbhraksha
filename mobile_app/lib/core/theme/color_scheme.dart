import 'package:flutter/material.dart';

/// KumbhRaksha brand colors. Primary red signals urgency for missing-person
/// alerts; blue conveys trust/action; green marks positive outcomes.
class AppColors {
  AppColors._();

  // Brand
  static const Color primary = Color(0xFFEF4444); // Emergency red
  static const Color secondary = Color(0xFF3B82F6); // Action blue
  static const Color tertiary = Color(0xFF10B981); // Success green

  // Light variants
  static const Color primaryLight = Color(0xFFFEE2E2);
  static const Color secondaryLight = Color(0xFFDBEAFE);
  static const Color tertiaryLight = Color(0xFFD1FAE5);

  // Dark variants
  static const Color primaryDark = Color(0xFF7F1D1D);
  static const Color secondaryDark = Color(0xFF1E3A8A);
  static const Color tertiaryDark = Color(0xFF064E3B);

  // Neutrals
  static const Color outline = Color(0xFF9CA3AF);
  static const Color outlineVariant = Color(0xFFD1D5DB);
  static const Color onSurfaceLight = Color(0xFF1F2937);
  static const Color onSurfaceDark = Color(0xFFF3F4F6);
}

final ColorScheme lightColorScheme = ColorScheme.fromSeed(
  seedColor: AppColors.primary,
  brightness: Brightness.light,
).copyWith(
  primary: AppColors.primary,
  secondary: AppColors.secondary,
  tertiary: AppColors.tertiary,
  error: AppColors.primary,
  surface: const Color(0xFFFAFAFA),
  onSurface: AppColors.onSurfaceLight,
);

final ColorScheme darkColorScheme = ColorScheme.fromSeed(
  seedColor: AppColors.primary,
  brightness: Brightness.dark,
).copyWith(
  primary: const Color(0xFFFF6B6B),
  secondary: const Color(0xFF60A5FA),
  tertiary: const Color(0xFF34D399),
  error: const Color(0xFFFF6B6B),
  surface: const Color(0xFF121212),
  onSurface: AppColors.onSurfaceDark,
);
