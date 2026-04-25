import 'user.dart';

/// An authenticated session returned after sign-in or token refresh.
class NselfSession {
  final String accessToken;
  final String? refreshToken;
  final String tokenType;
  final int? expiresIn;
  final DateTime? expiresAt;
  final NselfUser user;

  const NselfSession({
    required this.accessToken,
    this.refreshToken,
    this.tokenType = 'Bearer',
    this.expiresIn,
    this.expiresAt,
    required this.user,
  });

  /// Whether the access token is expired (with a 60-second buffer).
  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!.subtract(const Duration(seconds: 60)));
  }

  factory NselfSession.fromJson(Map<String, dynamic> json) {
    final expiresIn = json['expires_in'] as int?;
    final expiresAt = expiresIn != null
        ? DateTime.now().add(Duration(seconds: expiresIn))
        : null;

    return NselfSession(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String?,
      tokenType: (json['token_type'] as String?) ?? 'Bearer',
      expiresIn: expiresIn,
      expiresAt: expiresAt,
      user: NselfUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'access_token': accessToken,
      if (refreshToken != null) 'refresh_token': refreshToken,
      'token_type': tokenType,
      if (expiresIn != null) 'expires_in': expiresIn,
      'user': user.toJson(),
    };
  }

  @override
  String toString() => 'NselfSession(user: ${user.email}, expires: $expiresAt)';
}
