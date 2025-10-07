import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Order } from './entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { OrdersService } from './orders.service';

@Module({
  imports: [SequelizeModule.forFeature([Order, Product, Customer])],
  controllers: [OrdersController],
  providers:[OrdersService]
})
export class OrdersModule {}
