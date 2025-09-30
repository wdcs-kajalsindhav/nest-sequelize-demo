import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Order } from 'src/orders/entities/order.entity';

@Table
export class Product extends Model<Product> {
  @Column
  name: string;

  @Column
  price: number;

  @Column
  category: string;

  @HasMany(() => Order, { foreignKey: 'product_id' })
  orders: Order[];
}
