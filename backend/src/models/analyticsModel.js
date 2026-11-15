import { Product, StockMovement } from '../db/schemas.js';

export async function overview() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    lowStockCount,
    outOfStockCount,
    inventoryAggregate,
    movementAggregate,
  ] = await Promise.all([
    Product.countDocuments({ is_active: true }),
    Product.countDocuments({
      is_active: true,
      stock_quantity: { $gt: 0 },
      $expr: { $lte: ['$stock_quantity', '$reorder_threshold'] },
    }),
    Product.countDocuments({ is_active: true, stock_quantity: 0 }),
    Product.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: null, total: { $sum: '$stock_quantity' } } },
    ]),
    StockMovement.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          total_in: {
            $sum: { $cond: [{ $gt: ['$quantity_change', 0] }, '$quantity_change', 0] },
          },
          total_out: {
            $sum: { $cond: [{ $lt: ['$quantity_change', 0] }, { $abs: '$quantity_change' }, 0] },
          },
        },
      },
    ]),
  ]);

  return {
    inventory: {
      quantityInHand: inventoryAggregate[0]?.total || 0,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      recentStockIn: movementAggregate[0]?.total_in || 0,
      recentStockOut: movementAggregate[0]?.total_out || 0,
    },
  };
}

export async function salesPurchaseChart({ period = 'week' } = {}) {
  const spanDays = period === 'month' ? 180 : 56;
  const since = new Date(Date.now() - spanDays * 24 * 60 * 60 * 1000);

  const result = await StockMovement.aggregate([
    { $match: { created_at: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$created_at',
          },
        },
        purchase: {
          $sum: { $cond: [{ $gt: ['$quantity_change', 0] }, '$quantity_change', 0] },
        },
        sales: {
          $sum: { $cond: [{ $lt: ['$quantity_change', 0] }, { $abs: '$quantity_change' }, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return result.map((row) => ({
    label: row._id,
    purchase: Number(row.purchase || 0),
    sales: Number(row.sales || 0),
  }));
}

export async function orderSummaryChart() {
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const result = await StockMovement.aggregate([
    { $match: { created_at: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: '$created_at',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return result.map((row) => ({
    label: row._id,
    ordered: Number(row.count),
    delivered: Number(row.count),
  }));
}

export async function topSellingProducts({ limit = 5 } = {}) {
  const result = await StockMovement.aggregate([
    { $match: { quantity_change: { $lt: 0 } } },
    {
      $group: {
        _id: '$product_id',
        sold_quantity: { $sum: { $abs: '$quantity_change' } },
      },
    },
    { $sort: { sold_quantity: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $match: { 'product.is_active': true } },
    {
      $project: {
        id: { $toString: '$product._id' },
        sku: '$product.sku',
        name: '$product.name',
        stock_quantity: '$product.stock_quantity',
        selling_price: '$product.selling_price',
        sold_quantity: 1,
      },
    },
  ]);

  return result;
}
