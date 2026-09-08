import { dataStore } from '../store/persistence.js';

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const overview = dataStore.getAnalyticsOverview();

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = dataStore.getAlerts();

    res.status(200).json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getAnalyticsOverview, getAlerts };
