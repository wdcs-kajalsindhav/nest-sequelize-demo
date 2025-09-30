import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Customer } from './entities/customer.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { QueryTypes } from 'sequelize';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer) private customerModel: typeof Customer,
    @InjectModel(Order) private orderModel: typeof Order,
  ) {}

  async createCustomer(data: { name: string; city: string }) {
    return this.customerModel.create(data);
  }

  async getCustomersWithOrders() {
    return this.customerModel.findAll({
      include: [
        {
          model: Order,
          include: [Product],
        },
      ],
    });
  }

  async getCustomerById(id: any) {
    return this.customerModel.findOne({
      where: { id },
      include: [{ model: Order, include: [Product] }],
    });
  }

  async updateCustomer(id: any, data: { name?: string; city?: string }) {
    await this.customerModel.update(data, { where: { id } });
    return this.getCustomerById(id);
  }

  async deleteCustomer(id: number) {
    const deleted = await this.customerModel.destroy({ where: { id } });
    if (deleted === 0) {
      return { message: 'Customer not found' };
    }
    return { message: 'Customer deleted successfully' };
  }

  async totalSpentByCustomers() {
    try {
      const query = `SELECT c.name, SUM(p.price * o.quantity) AS total_spent, p.name AS products 
            FROM "Customers" c
            JOIN "Orders" o ON c.id = o.customer_id
            JOIN "Products" p ON p.id = o.product_id
            GROUP BY c.id, c.name, p.name
             `;
      const result = await this.customerModel.sequelize.query(query, {
        type: QueryTypes.SELECT,
      });
      return result;
    } catch (error) {
      console.log(
        '🚀 ~ CustomersService ~ totalSpentByCustomers ~ error:',
        error,
      );
    }
  }

  async spendingCategory() {
    try {
      const query = `SELECT c.name,
       COUNT(o.id) AS total_orders,
       COALESCE(SUM(p.price * o.quantity), 0) AS total_spent,
       CASE
           WHEN SUM(p.price * o.quantity) >= 1000 THEN 'High'
           WHEN SUM(p.price * o.quantity) BETWEEN 500 AND 999 THEN 'Medium'
           ELSE 'Low'
       END AS spending_category
FROM "Customers" c
LEFT JOIN "Orders" o ON c.id = o.customer_id
LEFT JOIN "Products" p ON o.product_id = p.id
GROUP BY c.name`;
      const result = await this.customerModel.sequelize.query(query);
      return result;
    } catch (error) {
      console.log('🚀 ~ CustomersService ~ spendingCategory ~ error:', error);
    }
  }

  async getHighValueCustomers(amount: number) {
    try {
      const [results] = await this.customerModel.sequelize.query(
        ` SELECT c.id AS customer_id, c.name, c.city, SUM(p.price * o.quantity) AS total_spent
    FROM "Customers" c
    JOIN "Orders" o ON c.id = o.customer_id
    JOIN "Products" p ON p.id = o.product_id
    GROUP BY c.id
    HAVING SUM(p.price * o.quantity) >= :amount
    ORDER BY total_spent DESC;
  `,
        { replacements: { amount } },
      );
      return results;
    } catch (error) {
      console.log(
        '🚀 ~ CustomersService ~ getHighValueCustomers ~ error:',
        error,
      );
      throw error;
    }
  }

  async getCustomersByOrCondition(data: {
    minSpent: number;
    minOrders: number;
  }) {
    try {
      const { minSpent, minOrders } = data;
      const query = `
      SELECT 
      c.id AS customer_id,
      c.name,
      c.city,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(p.price * o.quantity), 0) AS total_spent,
      AVG(o.quantity) AS avg_quantity
    FROM "Customers" c
    LEFT JOIN "Orders" o ON c.id = o.customer_id
    LEFT JOIN "Products" p ON o.product_id = p.id
    GROUP BY c.id
    HAVING COALESCE(SUM(p.price * o.quantity), 0) >= :minSpent
       OR COUNT(o.id) >= :minOrders
    ORDER BY total_spent DESC;
      `;
      const results = await this.customerModel.sequelize.query(query, {
        replacements: { minSpent, minOrders },
        type: QueryTypes.SELECT,
      });

      const formattedResults = results?.map((r: any) => ({
        ...r,
        total_orders: Number(r.total_orders),
        total_spent: Number(r.total_spent),
        avg_quantity: Number(r.avg_quantity),
      }));

      return formattedResults;
    } catch (error) {
      console.log(
        '🚀 ~ CustomersService ~ getCustomersByOrCondition ~ error:',
        error,
      );
      throw error;
    }
  }

  async getTopSpenderPerCity() {
    try {
      const query = `
      SELECT
          c.name AS customer_name,
          c.city,
          SUM(o.quantity * p.price) AS total_spent
      FROM "Customers" c
      JOIN "Orders" o ON c.id = o.customer_id
      JOIN "Products" p ON o.product_id = p.id
      GROUP BY c.id, c.name, c.city
      HAVING SUM(o.quantity * p.price) = (
          SELECT MAX(customer_total)
          FROM (
              SELECT SUM(o2.quantity * p2.price) AS customer_total
              FROM "Customers" c2
              JOIN "Orders" o2 ON c2.id = o2.customer_id
              JOIN "Products" p2 ON o2.product_id = p2.id
              WHERE c2.city = c.city
              GROUP BY c2.id
          ) AS city_totals
      )
      ORDER BY c.city;
    `;
      console.log(
        '🚀 ~ CustomersService ~ getTopSpenderPerCity ~ query:',
        query,
      );

      const results: any[] = await this.customerModel.sequelize.query(query);

      return results.map((r) => ({
        ...r,
        total_spent: Number(r.total_spent),
      }));
    } catch (error) {
      console.log(
        '🚀 ~ CustomersService ~ getTopSpenderPerCity ~ error:',
        error,
      );
      throw error;
    }
  }

  async getFullCustomerAnalytics(minSpent: number = 0) {
    const query = `
      SELECT
          c.id AS customer_id,
          c.name AS customer_name,
          c.city,
          COALESCE(o_stats.total_orders, 0) AS total_orders, --total orders
          COALESCE(o_stats.total_spent, 0) AS total_spent, --total spent
          COALESCE(o_stats.avg_quantity, 0) AS avg_quantity, --avg quantity
          COALESCE(o_stats.total_discount, 0) AS total_discount, --total discount
          o_stats.last_order_date, --last order date
          city_rank.rank AS city_rank,
          tp.top_product,
          category_breakdown.category_data
      FROM "Customers" c

      -- Customer-level aggregates: total orders, spent, avg quantity, discount, last order date
      LEFT JOIN LATERAL (
          SELECT
              COUNT(o.id) AS total_orders,
              SUM(o.quantity * p.price) AS total_spent,
              AVG(o.quantity) AS avg_quantity,
              COALESCE(SUM(d.discount_amount),0) AS total_discount,
              MAX(o.order_date) AS last_order_date
          FROM "Orders" o
          LEFT JOIN "Products" p ON o.product_id = p.id
          LEFT JOIN "Discounts" d ON o.id = d.order_id
          WHERE o.customer_id = c.id
      ) AS o_stats ON true

      -- City-wise rank based on total spent
      LEFT JOIN LATERAL (
          SELECT r.rank
          FROM (
              SELECT c2.id AS customer_id,
                     RANK() OVER (PARTITION BY c2.city ORDER BY SUM(o2.quantity * p2.price) DESC) AS rank
              FROM "Customers" c2
              LEFT JOIN "Orders" o2 ON c2.id = o2.customer_id
              LEFT JOIN "Products" p2 ON o2.product_id = p2.id
              GROUP BY c2.id, c2.city
          ) r
          WHERE r.customer_id = c.id
      ) AS city_rank ON true

      -- Top product per customer based on quantity
      LEFT JOIN LATERAL (
          SELECT p.name AS top_product
          FROM "Orders" o
          JOIN "Products" p ON o.product_id = p.id
          WHERE o.customer_id = c.id
          GROUP BY p.id, p.name
          ORDER BY SUM(o.quantity) DESC
          LIMIT 1
      ) AS tp ON true

      -- Category-wise spending and discount per customer (as JSON)
      LEFT JOIN LATERAL (
          SELECT json_agg(
              json_build_object(
                  'category', category_totals.category,
                  'spent', category_totals.spent,
                  'discount', category_totals.discount
              )
          ) AS category_data
          FROM (
              SELECT 
                  p.category,
                  SUM(o.quantity * p.price) AS spent,
                  COALESCE(SUM(d.discount_amount), 0) AS discount
              FROM "Orders" o
              LEFT JOIN "Products" p ON o.product_id = p.id
              LEFT JOIN "Discounts" d ON o.id = d.order_id
              WHERE o.customer_id = c.id
              GROUP BY p.category
          ) AS category_totals
      ) AS category_breakdown ON true

      -- Filter customers by minimum total spent
      WHERE COALESCE(o_stats.total_spent, 0) >= :minSpent

      -- Order by city and total spent descending
      ORDER BY c.city;
    `;

    const results: any[] = await this.customerModel.sequelize.query(query, {
      replacements: { minSpent },
      type: QueryTypes.SELECT,
    });

    // Convert numeric fields for proper JSON
    return results.map((r) => ({
      ...r,
      total_orders: Number(r.total_orders),
      total_spent: Number(r.total_spent),
      avg_quantity: Number(r.avg_quantity),
      total_discount: Number(r.total_discount),
      category_breakdown: r.category_breakdown?.map((c: any) => ({
        category: c.category,
        spent: Number(c.spent),
        discount: Number(c.discount),
      })),
    }));
  }
}

