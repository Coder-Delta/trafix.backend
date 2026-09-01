export const cameraSchema = {
  tableName: 'cameras',
  description: 'Database placeholder for camera registry metadata',
  fields: {
    camera_id: 'TEXT PRIMARY KEY',
    name: 'TEXT',
    location: 'GEOGRAPHY(Point,4326)',
    status: 'TEXT',
    stream_url: 'TEXT',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
    updated_at: 'TIMESTAMPTZ DEFAULT NOW()',
  },
};

export default cameraSchema;
