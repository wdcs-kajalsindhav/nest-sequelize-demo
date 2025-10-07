import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get('with-order')
  async getAllProductsWithOrder() {
    return this.productService.getAllProductsWithOrder();
  }

  @Get('product-with-discount')
  async getProductsWithTotalDiscounts() {
    return this.productService.getProductsWithTotalDiscounts();
  }

  @Post('top-customer-product')
  async getTopCustomersForProduct(
    @Body()
    body: {
      productId: number;
      page?: number;
      pageSize?: number;
    },
  ) {
    return this.productService.getTopCustomersForProduct(body);
  }

  @Get('product-analytics')
  async getFullProductAnalyticsOptimized() {
    return this.productService.getFullProductAnalyticsOptimized();
  }
}
