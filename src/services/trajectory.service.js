import { dataStore } from '../store/persistence.js';

export const trajectoryService = {
  /**
   * Reconstructs vehicle trajectory from chronological camera detection events.
   * Matches either by vehicle_id (e.g. VH_001) or license plate (e.g. WB12AB1234).
   */
  async getTrajectoryByVehicleId(vehicleIdOrPlate) {
    const trajectory = dataStore.getVehicleTrajectory(vehicleIdOrPlate);
    if (!trajectory) {
      return {
        success: false,
        data: null,
        message: `No trajectory found for vehicle or plate '${vehicleIdOrPlate}'`,
      };
    }

    return {
      success: true,
      data: trajectory,
    };
  },
};

export default trajectoryService;
