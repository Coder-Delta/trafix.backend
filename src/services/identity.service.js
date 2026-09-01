export const identityService = {
  async createUserIdentity(userPayload) {
    return {
      success: true,
      data: {
        user_id: userPayload.user_id || 'user_placeholder',
        role: userPayload.role || 'operator',
        status: 'active',
      },
      message: 'TODO: implement identity registration',
    };
  },
};

export default identityService;
