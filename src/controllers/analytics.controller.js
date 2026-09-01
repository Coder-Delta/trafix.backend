export const getAnalyticsOverview = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        total_vehicles_detected: 0,
        unique_vehicles: 0,
        average_speed_kmh: 0,
        busiest_camera: null,
        incidents: [],
      },
      message: 'TODO: aggregate analytics across all detection and traffic data',
    });
  } catch (error) {
    next(error);
  }
};

export default { getAnalyticsOverview };
