export const alertSchema = {
  tableName: 'alerts',
  description: 'Database placeholder for incident and alert records',
  fields: {
    alert_id: 'TEXT PRIMARY KEY',
    type: 'TEXT',
    severity: 'TEXT',
    message: 'TEXT',
    related_vehicle_id: 'TEXT',
    related_camera_id: 'TEXT',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
  },
};

export default alertSchema;
