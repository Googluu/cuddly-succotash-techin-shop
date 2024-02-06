import { Injectable } from '@nestjs/common';

import { ProductsService } from 'src/products/products.service';

@Injectable()
export class SeedService {
  constructor(private readonly productService: ProductsService) {}

  async runSeed() {
    await this.insertNewProducts();

    return 'SEED EXCUTED';
  }

  private async insertNewProducts() {
    const deleteAllProducts = await this.productService.deleteAllProdructs();
    return true;
  }
}
