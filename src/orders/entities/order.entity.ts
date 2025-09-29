import {
  Column,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Customer } from '../../customers/entities/customer.entity';
import { Product } from 'src/products/entities/product.entity';

@Table({ tableName: 'Orders' })
export class Order extends Model<Order> {
  @ForeignKey(() => Customer)
  @ForeignKey(() => Product)
  @Column
  customer_id: number;

  @Column
  product_id: number;

  @Column
  quantity: number;

  @Column
  order_date: Date;

  @BelongsTo(() => Customer)
  customer: Customer;

  @BelongsTo(() => Product)
  product: Product;
}
