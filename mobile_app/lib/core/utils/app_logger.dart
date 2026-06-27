import 'package:logger/logger.dart';

/// Shared logger instance.
final Logger appLogger = Logger(
  printer: PrettyPrinter(methodCount: 0, errorMethodCount: 5),
);
