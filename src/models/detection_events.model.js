export const detectionEventSchema = {
  tableName: 'detection_events',
  description: 'Database placeholder for AI-produced detection events',
  fields: {
    event_id: 'TEXT PRIMARY KEY',
    camera_id: 'TEXT REFERENCES cameras(camera_id)',
    observed_at: 'TIMESTAMPTZ',
    local_track_id: 'TEXT',
    vehicle_type: 'TEXT',
    plate_number: 'TEXT',
    plate_confidence: 'NUMERIC(5,4)',
    vehicle_embedding: 'TEXT',
    embedding_model: 'TEXT',
    embedding_version: 'TEXT',
    vehicle_confidence: 'NUMERIC(5,4)',
    bounding_box: 'JSONB',
    frame_reference: 'TEXT',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
  },
};

export default detectionEventSchema;
