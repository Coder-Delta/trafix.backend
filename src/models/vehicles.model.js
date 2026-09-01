export const vehicleSchema = {
  tableName: 'vehicles',
  description: 'Database placeholder for global vehicle identity records',
  fields: {
    vehicle_id: 'TEXT PRIMARY KEY',
    vehicle_type: 'TEXT',
    plate_number: 'TEXT',
    confidence: 'NUMERIC(5,4)',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
    updated_at: 'TIMESTAMPTZ DEFAULT NOW()',
  },
};

export default vehicleSchema;
