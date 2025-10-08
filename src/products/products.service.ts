import { InjectModel } from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Discount } from 'src/discounts/entities/dixcount.entity';
import { QueryTypes } from 'sequelize';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product) private productModel: typeof Product) {}
  async getAllProductsWithOrder() {
    const query = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.category,
        p.price,
        o.id AS order_id,
        o.quantity,
        c.name AS customer_name,
        COALESCE(d.discount_amount, 0) AS discount_amount,
        (o.quantity * p.price - COALESCE(d.discount_amount, 0)) AS total_amount
      FROM "Products" p
      LEFT JOIN "Orders" o ON o.product_id = p.id
      LEFT JOIN "Customers" c ON c.id = o.customer_id
      LEFT JOIN "Discounts" d ON d.order_id = o.id
      ORDER BY p.id, o.id;
    `;

    const results = await this.productModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results;
  }

  async getProductsWithTotalDiscounts() {
    const query = `SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.price,
    c.name AS customer_name,
    COALESCE(SUM(d.discount_amount), 0) AS total_discount,
    SUM(o.quantity * p.price - COALESCE(d.discount_amount, 0)) AS total_amount
  FROM "Products" p
  LEFT JOIN "Orders" o ON o.product_id = p.id
  LEFT JOIN "Discounts" d ON d.order_id = o.id
  LEFT JOIN "Customers" c ON c.id = o.customer_id
  GROUP BY p.id, p.name, p.price, c.name
  ORDER BY total_discount DESC;
    `;
    const result = await this.productModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
    return result;
  }

  async getTopCustomersForProduct(body: {
    productId: number;
    page?: number;
    pageSize?: number;
  }) {
    const { productId, page = 1, pageSize = 5 } = body;
    const offset = (page - 1) * pageSize;

    const query = `SELECT 
      c.id AS customer_id,
      c.name AS customer_name,
      c.city AS city,
      p.id AS product_id,
      p.name AS product_name,
      p.price AS product_price,
      COALESCE(SUM(o.quantity * p.price), 0) AS total_spent
    FROM "Orders" o
    JOIN "Customers" c ON o.customer_id = c.id
    JOIN "Products" p ON o.product_id = p.id
    WHERE p.id = :productId
    GROUP BY c.id, c.name, c.city, p.id, p.name, p.price
    ORDER BY total_spent DESC
    LIMIT :limit
    OFFSET :offset
    `;

    const results = await this.productModel.sequelize.query(query, {
      replacements: { productId, limit: pageSize, offset },
      type: QueryTypes.SELECT,
    });

    return results;
  }

  async getFullProductAnalyticsOptimized() {
    const query = `
  SELECT
  p.id,
  p.name,
  p.category,
  COALESCE(SUM(p.price * o.quantity), 0) AS total_amount,
  SUM(o.quantity * p.price - COALESCE(d.discount_amount, 0)) AS "total_revenue",

  AVG(COALESCE(d.discount_amount, 0) / NULLIF(o.quantity * p.price, 0) * 100) AS "avg_discount_percent",

    COUNT(DISTINCT CASE
    WHEN o.customer_id IN ( 
      SELECT o2.customer_id
      FROM "Orders" o2
      WHERE o2.product_id = p.id
      GROUP BY o2.customer_id
      HAVING COUNT(o2.id) > 1
    )
    THEN o.customer_id
  END) AS "repeat_customer_count",

  (
    SELECT c2.name
    FROM "Customers" c2
    JOIN "Orders" o3 ON o3.customer_id = c2.id
    WHERE o3.product_id = p.id
    GROUP BY c2.id
    ORDER BY COUNT(o3.id) DESC
    LIMIT 1
  ) AS "top_customer",

  DENSE_RANK() OVER (
    PARTITION BY p.category
    ORDER BY COUNT(o.id) DESC
  ) AS "category_rank"

FROM "Products" p
LEFT JOIN "Orders" o ON o.product_id = p.id
LEFT JOIN "Discounts" d ON d.order_id = o.id
LEFT JOIN "Customers" c ON c.id = o.customer_id

GROUP BY p.id, p.name, p.category
ORDER BY "total_revenue" DESC;
  `;

    const results = await this.productModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results.map((r: any) => ({
      ...r,
      total_amount: Number(r.total_amount),
      total_revenue: Number(r.total_revenue),
      avg_discount_percent: Number(r.avg_discount_percent),
    }));
  }

  async getMonthlyProductSales(data: { productId?: number }) {
    const { productId } = data;
    const where = productId ? `WHERE p.id = ${productId}` : '';
    const query = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      TO_CHAR(o.order_date, 'YYYY-MM') AS month,
      SUM(o.quantity) AS total_quantity,
      SUM(o.quantity * p.price - COALESCE(d.discount_amount,0)) AS total_revenue
    FROM "Products" p
    JOIN "Orders" o ON p.id = o.product_id
    LEFT JOIN "Discounts" d ON d.order_id = o.id
    ${where}
    GROUP BY p.id, p.name, month
    ORDER BY p.id, month;
  `;
    const results: any = await this.productModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
    return results.map((r) => ({
      ...r,
      total_quantity: Number(r.total_quantity),
      total_revenue: Number(r.total_revenue),
    }));
  }

  async getProductProfitability() {
    const query = `
   SELECT 
      p.id AS product_id,
      p.name AS product_name,
      SUM(o.quantity * p.price - COALESCE(d.discount_amount, 0)) AS revenue,
      SUM(o.quantity * p.price) AS cost,
      SUM(o.quantity * p.price - COALESCE(d.discount_amount, 0)) - SUM(o.quantity * p.price) AS profit
    FROM "Products" p
    JOIN "Orders" o ON o.product_id = p.id
    LEFT JOIN "Discounts" d ON d.order_id = o.id
    GROUP BY p.id, p.name
    ORDER BY profit DESC;
  `;
    const results:any = await this.productModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
    return results.map((r) => ({
      ...r,
      revenue: Number(r.revenue),
      cost: Number(r.cost),
      profit: Number(r.profit),
    }));
  }
}
