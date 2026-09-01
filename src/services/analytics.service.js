export const analyticsService = {
  async getOverview() {
    return {
      success: true,
      data: {
        overview: {
          total_vehicles_detected: 0,
          unique_vehicles: 0,
          top_routes: [],
          alerts: [],
        },
        generated_at: new Date().toISOString(),
      },
      message: 'TODO: implement analytics dashboards and aggregates',
    };
  },
};

export default analyticsService;
