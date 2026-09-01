export const trafficService = {
  async getOverview() {
    return {
      success: true,
      data: {
        summary: {
          cameras_online: 0,
          avg_speed_kmh: 0,
          congestion_level: 'low',
          incidents: 0,
        },
        regions: [],
      },
      message: 'TODO: implement traffic aggregation, queue metrics, and route analytics',
    };
  },

  async getCameraTraffic(cameraId) {
    return {
      success: true,
      data: {
        camera_id: cameraId,
        occupancy: 0,
        flow_rate: 0,
        avg_speed_kmh: 0,
        congestion_level: 'low',
      },
      message: 'TODO: implement per-camera traffic metrics',
    };
  },

  async getRouteTraffic(routeId) {
    return {
      success: true,
      data: {
        route_id: routeId,
        travel_time_seconds: 0,
        avg_speed_kmh: 0,
        congestion_level: 'low',
      },
      message: 'TODO: implement route-level traffic analytics',
    };
  },
};

export default trafficService;
