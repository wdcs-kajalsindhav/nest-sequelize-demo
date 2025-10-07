import { Get, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './entities/order.entity';
import { QueryTypes } from 'sequelize';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order) private orderModel: Order) {}

  async monthlyRevenuePerProduct() {
    const query = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        DATE_TRUNC('month', o.order_date) AS month,
        SUM(o.quantity * p.price - COALESCE(d.discount_amount, 0)) AS monthly_revenue
      FROM "Orders" o
      JOIN "Products" p ON o.product_id = p.id
      LEFT JOIN "Discounts" d ON d.order_id = o.id
      GROUP BY p.id, p.name, month
      ORDER BY p.id, month;
    `;

    const results = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results;
  }

  async getOrderCount() {
    const query = `
      SELECT
    o.customer_id,
    c.name AS customer_name,
    o.product_id,
    p.name AS product_name,
    DATE_TRUNC('week', o.order_date) AS week_start,
    COUNT(o.id) AS orders_count,
    SUM(o.quantity * p.price - COALESCE(d.discount_amount, 0)) AS revenue
    FROM "Orders" o
    JOIN "Products" p ON o.product_id = p.id
    JOIN "Customers" c ON o.customer_id = c.id
    LEFT JOIN "Discounts" d ON d.order_id = o.id
    GROUP BY o.customer_id, c.name, o.product_id, p.name, week_start
    ORDER BY week_start, o.customer_id, o.product_id;
    `;

    const results = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results.map((r: any) => ({
      ...r,
      orders_count: Number(r.orders_count),
      revenue: Number(r.revenue),
    }));
  }

  async getCustomerWithMostOrder() {
    const query = `
      SELECT p.category, c.id AS customer_id, c.name AS customer_name,
       COUNT(o.id) AS orders_count
    FROM "Orders" o
    JOIN "Products" p ON o.product_id = p.id
    JOIN "Customers" c ON o.customer_id = c.id
        GROUP BY p.category, c.id, c.name
        ORDER BY p.category, orders_count DESC;
    `;

    const results = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results.map((r: any) => ({
      ...r,
      orders_count: Number(r.orders_count),
    }));
  }

  async getOverallStats() {
    const query = `
      SELECT 
        COUNT(o.id) AS total_orders,
        SUM(o.quantity) AS total_items_sold,
        SUM(o.quantity * p.price) AS gross_revenue,
        SUM(COALESCE(d.discount_amount, 0)) AS total_discounts,
        SUM(o.quantity * p.price - COALESCE(d.discount_amount, 0)) AS net_revenue
      FROM "Orders" o
      JOIN "Products" p ON o.product_id = p.id
      LEFT JOIN "Discounts" d ON d.order_id = o.id;
    `;

    const results = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results;
  }

  async getRepeatCustomers(productId?: number) {
    const where = productId ? `WHERE o.product_id = ${productId}` : '';

    const query = `
    SELECT 
      COUNT(DISTINCT o.customer_id) AS repeat_customer_count
    FROM "Orders" o
    WHERE o.customer_id IN (
      SELECT o2.customer_id
      FROM "Orders" o2
      ${where}
      GROUP BY o2.customer_id, o2.product_id
      HAVING COUNT(o2.id) > 1
    );
  `;

    const results: any[] = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return { repeat_customer_count: Number(results[0].repeat_customer_count) };
  }

  async getRepeatCustomersPerProduct(filters?: {
    startDate?: string;
    endDate?: string;
    productId?: number;
  }) {
    const whereClauses: string[] = [];

    if (filters?.startDate) {
      whereClauses.push(`o.order_date >= '${filters.startDate}'`);
    }
    if (filters?.endDate) {
      whereClauses.push(`o.order_date <= '${filters.endDate}'`);
    }
    if (filters?.productId) {
      whereClauses.push(`p.id = ${filters.productId}`);
    }

    const where = whereClauses.length
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    const query = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      COUNT(DISTINCT o.customer_id) AS repeat_customer_count
    FROM "Products" p
    JOIN "Orders" o ON o.product_id = p.id
    ${where ? 'AND ' + whereClauses.join(' AND ') : ''}
    WHERE o.customer_id IN (
      SELECT o2.customer_id
      FROM "Orders" o2
      ${
        filters?.startDate || filters?.endDate
          ? 'WHERE ' +
            [
              filters?.startDate
                ? `o2.order_date >= '${filters.startDate}'`
                : null,
              filters?.endDate ? `o2.order_date <= '${filters.endDate}'` : null,
            ]
              .filter(Boolean)
              .join(' AND ')
          : ''
      }
      GROUP BY o2.customer_id, o2.product_id
      HAVING COUNT(o2.id) > 1
    )
    GROUP BY p.id, p.name
    ORDER BY repeat_customer_count DESC;
  `;

    const results: any[] = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results.map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      repeat_customer_count: Number(r.repeat_customer_count),
    }));
  }

  async getSalesRollup() {
    const query = `
      SELECT
        p.category AS category_name,
        p.name AS product_name,
        SUM(o.quantity) AS total_items,
        SUM(o.quantity * p.price - COALESCE(d.discount_amount,0)) AS total_revenue
      FROM "Orders" o
      LEFT JOIN "Products" p ON o.product_id = p.id
      LEFT JOIN "Discounts" d ON d.order_id = o.id
      GROUP BY ROLLUP(p.category, p.name)
      ORDER BY category_name NULLS LAST, product_name NULLS LAST;
    `;

    const results: any[] = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results.map((r) => {
      console.log('🚀 ~ OrdersService ~ getSalesRollup ~ r:', r.product_name);
      return {
        ...r,
        total_items: Number(r.total_items),
        total_revenue: Number(r.total_revenue),
      };
    });
  }

  async getWeeklyProductSales() {
    const query = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        TO_CHAR(o.order_date, 'IYYY-IW') AS week,
        SUM(o.quantity) AS weekly_quantity,
        SUM(o.quantity * p.price - COALESCE(d.discount_amount,0)) AS weekly_revenue,
        SUM(SUM(o.quantity * p.price - COALESCE(d.discount_amount,0))) 
          OVER (PARTITION BY p.id ORDER BY TO_CHAR(o.order_date, 'IYYY-IW')) AS running_revenue
      FROM "Orders" o
      JOIN "Products" p ON o.product_id = p.id
      LEFT JOIN "Discounts" d ON d.order_id = o.id
      GROUP BY p.id, p.name, week
      ORDER BY p.id, week;
    `;

    const results = await this.orderModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results.map((r: any) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      week: r.week?.trim?.() || r.week,
      weekly_quantity: Number(r.weekly_quantity),
      weekly_revenue: Number(r.weekly_revenue),
      running_revenue: Number(r.running_revenue),
    }));
  }
}
