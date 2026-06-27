import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// Singleton SQLite access. Holds encounters, UUID registry, user cache and
/// pending (offline) reports.
class DatabaseService {
  DatabaseService._internal();
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;

  static Database? _database;

  Future<Database> get database async {
    _database ??= await _initDb();
    return _database!;
  }

  Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'kumbhraksha.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: _createDb,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _createDb(Database db, int version) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS encounters (
        id TEXT PRIMARY KEY,
        encountered_uuid TEXT NOT NULL,
        rssi INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        distance_estimate REAL,
        sync_status TEXT DEFAULT 'pending'
      )
    ''');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON encounters(timestamp)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_uuid ON encounters(encountered_uuid)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_sync_status ON encounters(sync_status)');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS my_ble_uuids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rotating_uuid TEXT NOT NULL,
        valid_from TEXT NOT NULL,
        valid_until TEXT NOT NULL,
        is_current INTEGER DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS pending_reports (
        id TEXT PRIMARY KEY,
        report_json TEXT NOT NULL,
        created_at TEXT,
        synced_at TEXT
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldV, int newV) async {
    // Future migrations.
  }

  Future<void> close() async {
    await _database?.close();
    _database = null;
  }
}
