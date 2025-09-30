import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomersModule } from './customers/customers.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Customer } from './customers/entities/customer.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { DiscountsModule } from './discounts/discounts.module';
import { Discount } from './discounts/entities/dixcount.entity';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'demo_db',
      models: [Customer, Order, Product, Discount],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    CustomersModule,
    OrdersModule,
    ProductsModule,
    DiscountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
