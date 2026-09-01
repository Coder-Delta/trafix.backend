export const userSchema = {
  tableName: 'users',
  description: 'Database placeholder for operator and admin accounts',
  fields: {
    user_id: 'TEXT PRIMARY KEY',
    email: 'TEXT UNIQUE',
    password_hash: 'TEXT',
    role: 'TEXT',
    status: 'TEXT',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
    updated_at: 'TIMESTAMPTZ DEFAULT NOW()',
  },
};

export default userSchema;
