export const trajectorySchema = {
  tableName: 'trajectories',
  description: 'Database placeholder for vehicle trajectories and route traces',
  fields: {
    trajectory_id: 'TEXT PRIMARY KEY',
    vehicle_id: 'TEXT REFERENCES vehicles(vehicle_id)',
    points: 'JSONB',
    route_id: 'TEXT',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
  },
};

export default trajectorySchema;
