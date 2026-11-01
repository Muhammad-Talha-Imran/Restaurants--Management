const reportsRepository = require('../repositories/reportsRepository');

const reportsController = {
  async getDashboard(req, res, next) {
    try {
      const summary = await reportsRepository.getDashboardSummary();
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  },

  async getSales(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const sales = await reportsRepository.getDailySalesReport({ startDate, endDate });
      res.json({
        success: true,
        data: sales
      });
    } catch (error) {
      next(error);
    }
  },

  async getTopItems(req, res, next) {
    try {
      const { limit } = req.query;
      const items = await reportsRepository.getTopSellingItems(limit);
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      next(error);
    }
  },

  async getCategorySales(req, res, next) {
    try {
      const data = await reportsRepository.getCategorySales();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async getStaffPerformance(req, res, next) {
    try {
      const data = await reportsRepository.getStaffPerformance();
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportsController;
