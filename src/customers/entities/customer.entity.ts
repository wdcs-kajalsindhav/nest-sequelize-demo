import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Order } from 'src/orders/entities/order.entity';

@Table({ tableName: 'Customers' })
export class Customer extends Model<Customer> {
  @Column
  name: string;

  @Column
  city: string;

  @HasMany(() => Order, { foreignKey: 'customer_id' })
  orders: Order[];
}
