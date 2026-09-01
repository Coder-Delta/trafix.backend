export const getTrafficOverview = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        summary: {
          network_status: 'stable',
          total_cameras: 1,
          avg_speed_kmh: 42,
          congestion_level: 'medium',
        },
        cameras: [],
      },
      message: 'TODO: aggregate live traffic metrics and congestion score',
    });
  } catch (error) {
    next(error);
  }
};

export const getTrafficByCamera = async (req, res, next) => {
  try {
    const { camera_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        camera_id,
        occupancy: 0.42,
        flow_rate: 120,
        avg_speed_kmh: 38,
        congestion_level: 'medium',
      },
      message: 'TODO: compute per-camera traffic metrics',
    });
  } catch (error) {
    next(error);
  }
};

export const getTrafficByRoute = async (req, res, next) => {
  try {
    const { route_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        route_id,
        avg_speed_kmh: 41,
        travel_time_seconds: 360,
        congestion_level: 'medium',
      },
      message: 'TODO: compute route-level flow and travel metrics',
    });
  } catch (error) {
    next(error);
  }
};

export default { getTrafficOverview, getTrafficByCamera, getTrafficByRoute };
