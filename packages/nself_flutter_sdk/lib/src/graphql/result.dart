/// The result of a GraphQL query or mutation.
class GraphQLResult {
  /// The parsed response data, or null on error.
  final Map<String, dynamic>? data;

  /// A list of GraphQL errors, if any.
  final List<GraphQLError>? errors;

  const GraphQLResult({this.data, this.errors});

  /// True if the response contains no errors.
  bool get hasErrors => errors != null && errors!.isNotEmpty;

  factory GraphQLResult.fromJson(Map<String, dynamic> json) {
    final rawErrors = json['errors'] as List<dynamic>?;
    return GraphQLResult(
      data: json['data'] as Map<String, dynamic>?,
      errors: rawErrors
          ?.map((e) => GraphQLError.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  @override
  String toString() => 'GraphQLResult(hasErrors: $hasErrors, data: $data)';
}

/// A single GraphQL error entry.
class GraphQLError {
  final String message;
  final List<Map<String, dynamic>>? locations;
  final List<String>? path;
  final Map<String, dynamic>? extensions;

  const GraphQLError({
    required this.message,
    this.locations,
    this.path,
    this.extensions,
  });

  factory GraphQLError.fromJson(Map<String, dynamic> json) {
    return GraphQLError(
      message: json['message'] as String,
      locations: (json['locations'] as List<dynamic>?)
          ?.cast<Map<String, dynamic>>(),
      path: (json['path'] as List<dynamic>?)?.cast<String>(),
      extensions: json['extensions'] as Map<String, dynamic>?,
    );
  }

  @override
  String toString() => 'GraphQLError($message)';
}
