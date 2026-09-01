export const trajectoryService = {
  async getTrajectoryByVehicleId(vehicleId) {
    return {
      success: true,
      data: {
        vehicle_id: vehicleId,
        points: [],
        detected_at: [],
      },
      message: 'TODO: implement trajectory reconstruction and map matching',
    };
  },
};

export default trajectoryService;
