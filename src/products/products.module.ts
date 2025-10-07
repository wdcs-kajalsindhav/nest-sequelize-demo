import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './entities/product.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Order } from 'src/orders/entities/order.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
    imports: [SequelizeModule.forFeature([Product, Customer, Order])],
    controllers: [ProductsController],
    providers:[ProductsService]
})
export class ProductsModule {}
