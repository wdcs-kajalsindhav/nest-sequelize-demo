import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Get('monthly-order-product')
  async getMonthlyRevenuePerProduct() {
    return this.orderService.monthlyRevenuePerProduct();
  }

  @Get('order-count')
  async getOrderCount() {
    return this.orderService.getOrderCount();
  }

  @Get('customer-with-order')
  async getCustomerWithMostOrder() {
    return this.orderService.getCustomerWithMostOrder();
  }

  @Get('overall')
  async getOverallStats() {
    return this.orderService.getOverallStats();
  }

  @Post('repeat-customer')
  async getRepeatCustomers(@Body('productId') productId?: number) {
    return this.orderService.getRepeatCustomers(productId);
  }

  @Post('repeat-customers-per-product')
  async getRepeatCustomersPerProduct(
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
    @Body('productId') productId?: number,
  ) {
    return this.orderService.getRepeatCustomersPerProduct({
      startDate,
      endDate,
      productId,
    });
  }

  @Get('sales-rollup')
  async getSalesRollup() {
    return this.orderService.getSalesRollup();
  }

  @Get('weekly-product-sales')
  async getWeeklyProductSales() {
    return this.orderService.getWeeklyProductSales();
  }
}
