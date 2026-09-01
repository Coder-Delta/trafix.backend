export const trafficMetricsSchema = {
  tableName: 'traffic_metrics',
  description: 'Database placeholder for traffic summaries and analytics snapshots',
  fields: {
    metric_id: 'TEXT PRIMARY KEY',
    camera_id: 'TEXT REFERENCES cameras(camera_id)',
    route_id: 'TEXT',
    avg_speed_kmh: 'NUMERIC(10,2)',
    occupancy: 'NUMERIC(5,4)',
    congestion_level: 'TEXT',
    observed_at: 'TIMESTAMPTZ',
  },
};

export default trafficMetricsSchema;
