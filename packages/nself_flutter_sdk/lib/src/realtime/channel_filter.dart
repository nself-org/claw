/// Filter definition for a Realtime Postgres change subscription.
class ChannelFilter {
  /// The database schema (default: 'public').
  final String schema;

  /// The table name to listen on.
  final String table;

  /// Row-level filter expression, e.g. 'id=eq.42'.
  final String? filter;

  /// The event type(s) to listen for.
  final RealtimeListenTypes event;

  const ChannelFilter({
    this.schema = 'public',
    required this.table,
    this.filter,
    this.event = RealtimeListenTypes.all,
  });

  Map<String, dynamic> toJson() {
    return {
      'schema': schema,
      'table': table,
      if (filter != null) 'filter': filter,
      'event': event.value,
    };
  }
}

/// The Postgres change event types supported by Realtime.
enum RealtimeListenTypes {
  all('*'),
  insert('INSERT'),
  update('UPDATE'),
  delete('DELETE'),
  postgresChanges('postgres_changes');

  final String value;
  const RealtimeListenTypes(this.value);
}
