import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/dimensions.dart';
import '../../../../models/witness_alert.dart';
import '../../../../providers/alerts_feed_provider.dart';
import '../../../../providers/ble_provider.dart';
import '../../../../widgets/cards/witness_alert_card.dart';
import '../widgets/area_alert_card.dart';
import 'confirm_sighting_screen.dart';
import 'witness_memory_screen.dart';

import '../../../../screens/nav_shell.dart';

/// Home / alert feed — paginated list backed by [AlertsFeedProvider] with live
/// WebSocket inserts and pull-to-refresh.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AlertsFeedProvider>().init();
    });
    _scroll.addListener(() {
      if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
        context.read<AlertsFeedProvider>().loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _onSeeThem(WitnessAlert alert) async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ConfirmSightingScreen(alert: alert),
    ));
  }

  Future<void> _onIWasThere(WitnessAlert alert) async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => WitnessMemoryScreen(alert: alert),
    ));
  }

  void _respond(WitnessAlert alert, String response) {
    context.read<AlertsFeedProvider>().respond(alert.id, response);
  }

  @override
  Widget build(BuildContext context) {
    final feed = context.watch<AlertsFeedProvider>();
    final text = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: feed.refresh,
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.all(Dimens.lg),
            itemCount: _itemCount(feed),
            itemBuilder: (context, index) {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: Dimens.md, left: Dimens.xs, right: Dimens.xs),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Active Alerts Near You',
                        style: text.titleLarge?.copyWith(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          // Tab index 2 is Map (Home=0, Cases=1, Map=2)
                          const TabSwitchNotification(2).dispatch(context);
                        },
                        child: Text(
                          'View Map',
                          style: text.titleSmall?.copyWith(
                            color: const Color(0xFFB06F43),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }
              final i = index - 1;
              if (i < feed.alerts.length) {
                final alert = feed.alerts[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: Dimens.md),
                  child: alert.isBleAlert
                      ? WitnessAlertCard(
                          alert: alert,
                          onRespond: (r) => r == 'yes'
                              ? _onSeeThem(alert)
                              : _respond(alert, r),
                        )
                      : AreaAlertCard(
                          alert: alert,
                          onIWasThere: () => _onIWasThere(alert),
                          onDismiss: () => _respond(alert, 'no'),
                        ),
                );
              }
              return _FeedFooter(feed: feed);
            },
          ),
        ),
      ),
    );
  }

  int _itemCount(AlertsFeedProvider feed) {
    // header + alerts + footer
    return 1 + feed.alerts.length + 1;
  }
}

class _FeedFooter extends StatelessWidget {
  const _FeedFooter({required this.feed});
  final AlertsFeedProvider feed;

  @override
  Widget build(BuildContext context) {
    if (feed.status == FeedStatus.loading && feed.alerts.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(Dimens.xl),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (feed.status == FeedStatus.error) {
      return Padding(
        padding: const EdgeInsets.all(Dimens.xl),
        child: Center(
          child: Column(children: [
            Text(feed.errorMessage ?? 'Something went wrong'),
            TextButton(onPressed: feed.refresh, child: const Text('Retry')),
          ]),
        ),
      );
    }
    if (feed.alerts.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(Dimens.xxl),
        child: Center(child: Text('No active alerts near you.')),
      );
    }
    if (feed.hasMore) {
      return const Padding(
        padding: EdgeInsets.all(Dimens.lg),
        child: Center(
          child: SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }
    return const Padding(
      padding: EdgeInsets.all(Dimens.lg),
      child: Center(child: Text("You're all caught up")),
    );
  }
}

class _ConnectionDot extends StatelessWidget {
  const _ConnectionDot({required this.connected});
  final bool connected;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(Icons.circle,
            size: 10, color: connected ? scheme.tertiary : scheme.outline),
        const SizedBox(width: 4),
        Text(connected ? 'Live' : 'Offline',
            style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

/// Live BLE scanning toggle + status.
class _ProtectionBanner extends StatelessWidget {
  const _ProtectionBanner();

  @override
  Widget build(BuildContext context) {
    final ble = context.watch<BleProvider>();
    final scheme = Theme.of(context).colorScheme;
    final active = ble.isActive;
    return Card(
      color: active
          ? scheme.tertiary.withValues(alpha: 0.10)
          : scheme.surfaceContainerHighest,
      child: Padding(
        padding: const EdgeInsets.all(Dimens.lg),
        child: Row(
          children: [
            Icon(active ? Icons.bluetooth_audio : Icons.bluetooth_disabled,
                color: active ? scheme.tertiary : scheme.outline, size: 32),
            const SizedBox(width: Dimens.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(active ? 'Protection active' : 'Protection off',
                      style: Theme.of(context).textTheme.titleMedium),
                  Text(
                    active
                        ? 'Scanning nearby • ${ble.encounterCount} signals seen'
                        : 'Turn on to help find people near you',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Switch(
              value: active,
              onChanged: (v) => v ? ble.start() : ble.stop(),
            ),
          ],
        ),
      ),
    );
  }
}
