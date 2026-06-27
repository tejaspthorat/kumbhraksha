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

import '../../../../core/utils/app_translations.dart';
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
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: feed.refresh,
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.symmetric(horizontal: Dimens.lg, vertical: Dimens.md),
            itemCount: _itemCount(feed),
            itemBuilder: (context, index) {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: Dimens.lg, left: Dimens.xs, right: Dimens.xs, top: Dimens.sm),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'KumbhRaksha',
                                style: text.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.8,
                                  color: scheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 2),
                              _ConnectionDot(connected: feed.isConnected),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {
                              const TabSwitchNotification(2).dispatch(context);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: scheme.outlineVariant, width: 1),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.map_outlined, size: 16, color: scheme.primary),
                                  const SizedBox(width: 6),
                                  Text(
                                    context.tr('radar_map'),
                                    style: text.labelMedium?.copyWith(
                                      color: scheme.primary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: Dimens.lg),
                      const _ProtectionBanner(),
                      const SizedBox(height: Dimens.xl),
                      Text(
                        context.tr('active_alerts'),
                        style: text.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: scheme.onSurface,
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
              return Padding(
                padding: const EdgeInsets.only(bottom: 80), // extra padding for floating nav bar
                child: _FeedFooter(feed: feed),
              );
            },
          ),
        ),
      ),
    );
  }

  int _itemCount(AlertsFeedProvider feed) {
    return 1 + feed.alerts.length + 1;
  }
}

class _FeedFooter extends StatelessWidget {
  const _FeedFooter({required this.feed});
  final AlertsFeedProvider feed;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
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
            const SizedBox(height: 8),
            OutlinedButton(onPressed: feed.refresh, child: const Text('Retry')),
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
    return Padding(
      padding: const EdgeInsets.all(Dimens.lg),
      child: Center(
        child: Text(
          "You're all caught up",
          style: TextStyle(color: scheme.onSurface.withOpacity(0.4), fontWeight: FontWeight.w600),
        ),
      ),
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
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.circle,
            size: 8, color: connected ? scheme.secondary : scheme.onSurface.withOpacity(0.3)),
        const SizedBox(width: 4),
        Text(
          connected ? context.tr('live_sync') : context.tr('offline_mode'),
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: connected ? scheme.secondary : scheme.onSurface.withOpacity(0.4),
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

/// Live BLE scanning toggle + status card styled like Apple Health.
class _ProtectionBanner extends StatelessWidget {
  const _ProtectionBanner();

  @override
  Widget build(BuildContext context) {
    final ble = context.watch<BleProvider>();
    final scheme = Theme.of(context).colorScheme;
    final active = ble.isActive;
    return Card(
      color: active
          ? scheme.secondary.withOpacity(0.02)
          : scheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: active ? scheme.secondary.withOpacity(0.3) : scheme.outlineVariant,
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(Dimens.lg),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: active ? scheme.secondary.withOpacity(0.08) : scheme.onSurface.withOpacity(0.04),
              ),
              child: Icon(
                active ? Icons.bluetooth_searching_rounded : Icons.bluetooth_disabled_rounded,
                color: active ? scheme.secondary : scheme.onSurface.withOpacity(0.3),
                size: 24,
              ),
            ),
            const SizedBox(width: Dimens.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    active ? context.tr('protection_active') : context.tr('radar_disabled'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: scheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    active
                        ? 'Scanning nearby • ${ble.encounterCount} encounters'
                        : context.tr('radar_disabled_desc'),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: scheme.onSurface.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ),
            Switch.adaptive(
              value: active,
              activeColor: scheme.secondary,
              onChanged: (v) => v ? ble.start() : ble.stop(),
            ),
          ],
        ),
      ),
    );
  }
}
