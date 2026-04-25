/// A user record returned by the nSelf Auth service.
class NselfUser {
  final String id;
  final String email;
  final Map<String, dynamic>? userMetadata;
  final Map<String, dynamic>? appMetadata;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const NselfUser({
    required this.id,
    required this.email,
    this.userMetadata,
    this.appMetadata,
    this.createdAt,
    this.updatedAt,
  });

  factory NselfUser.fromJson(Map<String, dynamic> json) {
    return NselfUser(
      id: json['id'] as String,
      email: json['email'] as String,
      userMetadata: json['user_metadata'] as Map<String, dynamic>?,
      appMetadata: json['app_metadata'] as Map<String, dynamic>?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      if (userMetadata != null) 'user_metadata': userMetadata,
      if (appMetadata != null) 'app_metadata': appMetadata,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }

  @override
  String toString() => 'NselfUser(id: $id, email: $email)';
}
