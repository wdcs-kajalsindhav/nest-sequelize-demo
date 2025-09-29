import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('')
  async createCustomer(@Body() data: { name: string; city: string }) {
    return this.customersService.createCustomer(data);
  }

  @Get('with-orders')
  async getCustomersWithOrders() {
    return this.customersService.getCustomersWithOrders();
  }

  @Get(':id')
  async getCustomerById(@Param() { id }: { id: string }) {
    return this.customersService.getCustomerById(id);
  }

  @Put(':id')
  async updateCustomer(@Param() { id }: { id: string }, @Body() body: any) {
    return this.customersService.updateCustomer(id, body);
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string) {
    return this.customersService.deleteCustomer(Number(id));
  }

  @Get('total-spent')
  async getTotalSpent() {
    return this.customersService.totalSpentByCustomers();
  }

  @Get('spending-category')
  async getSpentCategoryWise() {
    return this.customersService.spendingCategory();
  }

  @Get('high-value/:amount')
  async getHighValueCustomers(@Param('amount', ParseIntPipe) amount: number) {
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    return this.customersService.getHighValueCustomers(amount);
  }
}
