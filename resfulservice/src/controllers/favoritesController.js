const FavoriteChart = require('../models/favoriteChart');
const elasticSearch = require('../utils/elasticSearch');
const latency = require('../middlewares/latencyTimer');
const { errorWriter, successWriter } = require('../utils/logWriter');
/**
 * Adds a favorite chart for a user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Promise<void>} - A promise that resolves when the favorite chart is added successfully.
 */
exports.addFavoriteChart = async (req, res, next) => {
  try {
    const { chartId } = req.body;
    const userId = req.user._id;

    // Use findOneAndUpdate to find the user's favorites and add the new chartId
    const chart = await FavoriteChart.findOneAndUpdate(
      { user: userId },
      { $addToSet: { chartIds: chartId } },
      { new: true, upsert: true }
    );

    successWriter(req, JSON.stringify(chart), 'addFavoriteChart');
    latency.latencyCalculator(res);
    return res.status(200).json({
      message: 'This chart is now added to your favourite list successfully.'
    });
  } catch (error) {
    next(errorWriter(req, error, 'addFavoriteChart', 500));
  }
};

/**
 * Removes a favorite chart for a user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Promise<void>} - A promise that resolves when the favorite chart is removed successfully.
 */
exports.removeFavoriteChart = async (req, res, next) => {
  try {
    const { chartId } = req.body;
    const userId = req.user._id;

    const chart = await FavoriteChart.findOneAndUpdate(
      { user: userId },
      { $pull: { chartIds: chartId } },
      { new: true }
    );

    if (req.isInternal) return chart;
    latency.latencyCalculator(res);
    successWriter(req, JSON.stringify(chart), 'removeFavoriteChart');
    return res.status(200).json({
      message:
        'This chart is now removed from your favourite list successfully.'
    });
  } catch (err) {
    next(errorWriter(req, err, 'removeFavoriteChart', 500));
  }
};

/**
 * Retrieves the favorite charts for a user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Promise<void>} - A promise that resolves when the favorite charts are retrieved successfully.
 */
exports.getFavoriteCharts = async (req, res, next) => {
  const page = parseInt(req?.query?.page) || 1;
  const pageSize = parseInt(req?.query?.pageSize) || 10;

  try {
    const userId = req.user._id;
    const favoriteCharts = await FavoriteChart.findOne(
      { user: userId },
      { chartIds: 1 }
    );
    const chartIds = favoriteCharts?.chartIds;

    if (!chartIds || !chartIds.length) {
      return res.status(200).json({ data: [], total: 0, missingCharts: [] });
    }

    // If user have favourite chart, load it from ES
    req.query.chartIds = chartIds;
    const resp = await elasticSearch.loadAllCharts(req, page, pageSize);
    const charts = resp?.data?.hits?.hits ?? [];

    const receivedChartIdsSet = new Set(
      charts.map((chart) => chart._source.identifier)
    );
    const missingCharts = chartIds.filter((id) => !receivedChartIdsSet.has(id));

    // If some chart not present anylonger in ES, call removeFavoriteChart for each missing chart ID
    if (missingCharts.length > 0) {
      for (const chartId of missingCharts) {
        const removeReq = { ...req, body: { chartId }, isInternal: true };
        await this.removeFavoriteChart(removeReq, res, next);
      }
    }

    const response = {
      data: charts,
      total: resp.data?.hits?.total?.value,
      missingCharts
    };

    latency.latencyCalculator(res);
    return res.status(200).json(response);
  } catch (err) {
    next(errorWriter(req, err, 'getFavoriteCharts', 500));
  }
};
