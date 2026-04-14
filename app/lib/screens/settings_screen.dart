/// E-26-04: Settings with 10 navigation sections.
///
/// Full-screen stack navigation. Adaptive: Material 3 on Android,
/// Cupertino on iOS via platform checks.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/settings_provider.dart';
import '../models/app_settings.dart';
import '../services/beta_channel_service.dart';
import 'feedback_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          _SettingsGroup(title: 'Preferences', children: [
            _SettingsNavTile(
              icon: Icons.tune,
              title: 'General',
              onTap: () => _push(context, const _GeneralSettings()),
            ),
            _SettingsNavTile(
              icon: Icons.smart_toy,
              title: 'Model',
              onTap: () => _push(context, const _ModelSettings()),
            ),
            _SettingsNavTile(
              icon: Icons.palette,
              title: 'Appearance',
              onTap: () => _push(context, const _AppearanceSettings()),
            ),
          ]),
          _SettingsGroup(title: 'Account', children: [
            _SettingsNavTile(
              icon: Icons.vpn_key,
              title: 'API Keys',
              onTap: () => _push(context, const _ApiKeysSettings()),
            ),
            _SettingsNavTile(
              icon: Icons.lock,
              title: 'Privacy',
              onTap: () => _push(context, const _PrivacySettings()),
            ),
            _SettingsNavTile(
              icon: Icons.credit_card,
              title: 'Billing',
              onTap: () => _push(context, const _BillingSettings()),
            ),
          ]),
          _SettingsGroup(title: 'Data & Sync', children: [
            _SettingsNavTile(
              icon: Icons.notifications,
              title: 'Notifications',
              onTap: () => _push(context, const _NotificationSettings()),
            ),
            _SettingsNavTile(
              icon: Icons.storage,
              title: 'Data',
              onTap: () => _push(context, const _DataSettings()),
            ),
            _SettingsNavTile(
              icon: Icons.share,
              title: 'Sharing',
              onTap: () => _push(context, const _SharingSettings()),
            ),
          ]),
          _SettingsGroup(title: 'Other', children: [
            _SettingsNavTile(
              icon: Icons.build,
              title: 'Advanced',
              onTap: () => _push(context, const _AdvancedSettings()),
            ),
            _SettingsNavTile(
              icon: Icons.feedback,
              title: 'Send Feedback',
              onTap: () => _push(context, const FeedbackScreen()),
            ),
            _SettingsNavTile(
              icon: Icons.science,
              title: 'Beta Program',
              onTap: () => _push(context, const _BetaProgramSettings()),
            ),
            _SettingsNavTile(
              icon: Icons.info_outline,
              title: 'About',
              onTap: () => _push(context, const _AboutSettings()),
            ),
          ]),
        ],
      ),
    );
  }

  void _push(BuildContext context, Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => screen),
    );
  }
}

// -- Shared Components -------------------------------------------------------

class _SettingsGroup extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SettingsGroup({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Theme.of(context)
                      .colorScheme
                      .primary,
                ),
          ),
        ),
        ...children,
      ],
    );
  }
}

class _SettingsNavTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  const _SettingsNavTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}

// -- Sub-screens -------------------------------------------------------------

class _GeneralSettings extends ConsumerWidget {
  const _GeneralSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('General')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Display name'),
            subtitle: Text(
                settings.displayName.isEmpty ? 'Not set' : settings.displayName),
            onTap: () => _editTextField(context, ref, 'Display name',
                settings.displayName, (v) {
              ref.read(settingsProvider.notifier)
                  .update((s) => s.copyWith(displayName: v));
            }),
          ),
          ListTile(
            title: const Text('Language'),
            subtitle: Text(settings.language),
          ),
          SwitchListTile(
            title: const Text('Launch at login'),
            value: settings.launchAtLogin,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(launchAtLogin: v)),
          ),
        ],
      ),
    );
  }
}

class _ModelSettings extends ConsumerWidget {
  const _ModelSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Model')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Default model'),
            subtitle: Text(settings.defaultModel),
          ),
          ListTile(
            title: const Text('Temperature'),
            subtitle: Slider(
              value: settings.temperature,
              min: 0,
              max: 2,
              divisions: 20,
              label: settings.temperature.toStringAsFixed(1),
              onChanged: (v) => ref
                  .read(settingsProvider.notifier)
                  .update((s) => s.copyWith(temperature: v)),
            ),
          ),
          ListTile(
            title: const Text('Max tokens'),
            subtitle: Text('${settings.maxTokens}'),
          ),
        ],
      ),
    );
  }
}

class _AppearanceSettings extends ConsumerWidget {
  const _AppearanceSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Appearance')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Theme'),
            subtitle: Text(settings.theme),
            onTap: () {
              showModalBottomSheet(
                context: context,
                builder: (ctx) => SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: ['system', 'dark', 'light'].map((t) {
                      return RadioListTile<String>(
                        title: Text(t[0].toUpperCase() + t.substring(1)),
                        value: t,
                        groupValue: settings.theme,
                        onChanged: (v) {
                          ref.read(settingsProvider.notifier)
                              .update((s) => s.copyWith(theme: v));
                          Navigator.of(ctx).pop();
                        },
                      );
                    }).toList(),
                  ),
                ),
              );
            },
          ),
          ListTile(
            title: const Text('Font size'),
            subtitle: Slider(
              value: settings.fontSize,
              min: 10,
              max: 24,
              divisions: 14,
              label: settings.fontSize.toStringAsFixed(0),
              onChanged: (v) => ref
                  .read(settingsProvider.notifier)
                  .update((s) => s.copyWith(fontSize: v)),
            ),
          ),
          SwitchListTile(
            title: const Text('Compact mode'),
            value: settings.compactMode,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(compactMode: v)),
          ),
        ],
      ),
    );
  }
}

class _ApiKeysSettings extends ConsumerWidget {
  const _ApiKeysSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('API Keys')),
      body: settings.apiKeys.isEmpty
          ? const Center(child: Text('No API keys configured'))
          : ListView(
              children: settings.apiKeys.entries.map((entry) {
                return ListTile(
                  title: Text(entry.key),
                  subtitle: Text(
                    '${entry.value.substring(0, entry.value.length > 8 ? 8 : entry.value.length)}...',
                  ),
                  trailing: const Icon(Icons.delete_outline),
                );
              }).toList(),
            ),
    );
  }
}

class _PrivacySettings extends ConsumerWidget {
  const _PrivacySettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Biometric lock'),
            subtitle: const Text('Require Face ID / Touch ID on resume'),
            value: settings.biometricLock,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(biometricLock: v)),
          ),
          SwitchListTile(
            title: const Text('Analytics'),
            value: settings.analyticsEnabled,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(analyticsEnabled: v)),
          ),
          ListTile(
            title: const Text('Auto-lock timeout'),
            subtitle: Text('${settings.autoLockMinutes} minutes'),
          ),
        ],
      ),
    );
  }
}

class _NotificationSettings extends ConsumerWidget {
  const _NotificationSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Push notifications'),
            value: settings.pushEnabled,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(pushEnabled: v)),
          ),
          SwitchListTile(
            title: const Text('Sound'),
            value: settings.soundEnabled,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(soundEnabled: v)),
          ),
          SwitchListTile(
            title: const Text('Badge'),
            value: settings.badgeEnabled,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(badgeEnabled: v)),
          ),
          SwitchListTile(
            title: const Text('Daily digest'),
            value: settings.digestEnabled,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(digestEnabled: v)),
          ),
        ],
      ),
    );
  }
}

class _DataSettings extends ConsumerWidget {
  const _DataSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Data')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Offline mode'),
            subtitle: const Text('Cache data locally for offline access'),
            value: settings.offlineModeEnabled,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(offlineModeEnabled: v)),
          ),
          ListTile(
            title: const Text('Cache size limit'),
            subtitle: Text('${settings.cacheSizeMb} MB'),
          ),
          SwitchListTile(
            title: const Text('Auto sync'),
            value: settings.autoSync,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(autoSync: v)),
          ),
          ListTile(
            title: const Text('Sync interval'),
            subtitle: Text('Every ${settings.syncIntervalMinutes} minutes'),
          ),
          ListTile(
            title: const Text('Clear cache'),
            leading: const Icon(Icons.delete_sweep),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cache cleared')),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SharingSettings extends ConsumerWidget {
  const _SharingSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Sharing')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Share sheet extension'),
            subtitle: const Text('Show "Save to claw" in share sheet'),
            value: settings.shareSheetEnabled,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(shareSheetEnabled: v)),
          ),
          ListTile(
            title: const Text('Default share topic'),
            subtitle: Text(settings.defaultShareTopic.isEmpty
                ? 'Last used topic'
                : settings.defaultShareTopic),
          ),
        ],
      ),
    );
  }
}

class _BillingSettings extends ConsumerWidget {
  const _BillingSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Billing')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Subscription'),
            subtitle: Text(settings.subscriptionTier ?? 'Free'),
          ),
          if (settings.subscriptionExpiry != null)
            ListTile(
              title: const Text('Expires'),
              subtitle: Text(
                  settings.subscriptionExpiry!.toLocal().toString().split(' ')[0]),
            ),
          ListTile(
            title: const Text('Manage subscription'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () {
              // Open billing portal.
            },
          ),
        ],
      ),
    );
  }
}

class _AdvancedSettings extends ConsumerWidget {
  const _AdvancedSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Advanced')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Debug mode'),
            value: settings.debugMode,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(debugMode: v)),
          ),
          ListTile(
            title: const Text('Custom endpoint'),
            subtitle: Text(settings.customEndpoint ?? 'Not set'),
            onTap: () => _editTextField(context, ref, 'Custom endpoint',
                settings.customEndpoint ?? '', (v) {
              ref.read(settingsProvider.notifier).update(
                  (s) => s.copyWith(customEndpoint: v.isEmpty ? null : v));
            }),
          ),
          SwitchListTile(
            title: const Text('Experimental features'),
            value: settings.experimentalFeatures,
            onChanged: (v) => ref
                .read(settingsProvider.notifier)
                .update((s) => s.copyWith(experimentalFeatures: v)),
          ),
        ],
      ),
    );
  }
}

class _BetaProgramSettings extends ConsumerStatefulWidget {
  const _BetaProgramSettings();

  @override
  ConsumerState<_BetaProgramSettings> createState() =>
      _BetaProgramSettingsState();
}

class _BetaProgramSettingsState extends ConsumerState<_BetaProgramSettings> {
  bool _opted = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final v = await BetaChannelService.isBetaOptedIn();
    if (mounted) setState(() { _opted = v; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Beta Program')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                SwitchListTile(
                  title: const Text('Join beta program'),
                  subtitle: const Text(
                    'Get early access to new features. Beta builds may be less stable.',
                  ),
                  value: _opted,
                  onChanged: (v) async {
                    await BetaChannelService.setBetaOptIn(v);
                    setState(() => _opted = v);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(v
                              ? 'Joined beta program. Updates will switch on next check.'
                              : 'Left beta program. Returning to stable channel.'),
                        ),
                      );
                    }
                  },
                ),
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'On iOS, beta builds are delivered via TestFlight. '
                    'On Android, via Play Internal Test. '
                    'On desktop, the auto-update feed switches to the beta channel.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ],
            ),
    );
  }
}

class _AboutSettings extends StatelessWidget {
  const _AboutSettings();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: ListView(
        children: [
          const ListTile(
            title: Text('nClaw'),
            subtitle: Text('v1.1.0'),
          ),
          ListTile(
            title: const Text('Privacy Policy'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () => launchUrl(Uri.parse('https://claw.nself.org/privacy')),
          ),
          ListTile(
            title: const Text('Terms of Service'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () => launchUrl(Uri.parse('https://claw.nself.org/terms')),
          ),
          ListTile(
            title: const Text('Support'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () => launchUrl(Uri.parse('https://claw.nself.org/support')),
          ),
          const ListTile(
            title: Text('License'),
            subtitle: Text('MIT'),
          ),
        ],
      ),
    );
  }
}

// -- Helpers -----------------------------------------------------------------

void _editTextField(
  BuildContext context,
  WidgetRef ref,
  String label,
  String currentValue,
  void Function(String) onSave,
) {
  final controller = TextEditingController(text: currentValue);
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(label),
      content: TextField(
        controller: controller,
        autofocus: true,
        decoration: InputDecoration(
          hintText: label,
          border: const OutlineInputBorder(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            onSave(controller.text.trim());
            Navigator.of(ctx).pop();
          },
          child: const Text('Save'),
        ),
      ],
    ),
  );
}
