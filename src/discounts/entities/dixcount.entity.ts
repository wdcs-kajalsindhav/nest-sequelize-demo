import {
  Column,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Order } from 'src/orders/entities/order.entity';

@Table({ tableName: 'Discounts' })
export class Discount extends Model<Discount> {
  @ForeignKey(() => Order)
  @Column
  order_id: number; // match Orders.id type

  @Column
  discount_amount: number;

  @BelongsTo(() => Order)
  order: Order;
}
