import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { Order } from 'src/orders/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [SequelizeModule.forFeature([Customer, Order, Product])],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
