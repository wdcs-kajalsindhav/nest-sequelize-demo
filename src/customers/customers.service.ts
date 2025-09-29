import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Customer } from './entities/customer.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { QueryTypes } from 'sequelize';
import e from 'express';

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
      const result = await this.customerModel.sequelize.query(query, {
        type: QueryTypes.SELECT,
      });
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
}
