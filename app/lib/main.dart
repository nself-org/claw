import 'dart:convert';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import 'screens/home_screen.dart';
import 'screens/pairing_screen.dart';
import 'providers/connection_provider.dart';
import 'services/deep_link_service.dart';

/// Stores the latest deep-link route received while the app is running.
///
/// Route values mirror the `nclaw://` host component:
/// - `"usage"` — navigate to the usage dashboard
/// - `"setup"` — navigate to the onboarding/setup wizard
/// Consumers watch this provider and react accordingly.
final deepLinkRouteProvider = StateProvider<String?>((ref) => null);

/// Returns `true` when the backend reports that first-run setup is not
/// complete (i.e. `/claw/setup/status` returns a `status` value other than
/// `"complete"`).
///
/// Falls back to `false` on any network or parse error so the onboarding
/// wizard is not shown unnecessarily when the server is unreachable.
final onboardingNeededProvider = FutureProvider<bool>((ref) async {
  final serverUrl =
      ref.watch(connectionProvider).activeServer?.url;
  if (serverUrl == null || serverUrl.isEmpty) return false;
  try {
    final uri = Uri.parse('$serverUrl/claw/setup/status');
    final response =
        await http.get(uri).timeout(const Duration(seconds: 8));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final status = data['status'] as String?;
        return status != null && status != 'complete';
      }
    }
  } catch (_) {
    // Network error — assume setup is complete to avoid blocking the user.
  }
  return false;
});

void main() {
  runApp(const ProviderScope(child: NClawApp()));
}

class NClawApp extends ConsumerStatefulWidget {
  const NClawApp({super.key});

  @override
  ConsumerState<NClawApp> createState() => _NClawAppState();
}

class _NClawAppState extends ConsumerState<NClawApp> {
  final _appLinks = AppLinks();

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    // Handle cold-start link (app launched via nclaw:// while not running).
    final initial = await _appLinks.getInitialLink();
    if (initial != null) _handleLink(initial);

    // Handle links received while the app is already running.
    _appLinks.uriLinkStream.listen(_handleLink);
  }

  void _handleLink(Uri uri) {
    if (uri.scheme != 'nclaw') return;

    if (uri.host == 'pair') {
      final server = uri.queryParameters['server'];
      final code = uri.queryParameters['code'];
      if (server != null && code != null && code.isNotEmpty) {
        ref.read(pendingPairProvider.notifier).state = PairParams(
          serverUrl: server,
          code: code.toUpperCase(),
        );
      }
    } else if (uri.host == 'chat') {
      // Switch to the Chat tab (index 0) in HomeScreen.
      ref.read(homeTabProvider.notifier).state = 0;
    } else if (uri.host == 'usage' || uri.host == 'setup') {
      // Signal consumers (e.g. HomeScreen) to navigate to the target screen.
      ref.read(deepLinkRouteProvider.notifier).state = uri.host;
    }
  }

  @override
  Widget build(BuildContext context) {
    final connectionState = ref.watch(connectionProvider);

    return MaterialApp(
      title: '\u014BClaw',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF6366F1),
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F0F1A),
        useMaterial3: true,
      ),
      // Show pairing screen if no servers are paired.
      // Show home screen once at least one server is configured.
      home: connectionState.hasPairedServers
          ? const HomeScreen()
          : const PairingScreen(),
    );
  }
}
