import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const { images = [], ...productDetail } = createProductDto;

    const product = this.productRepository.create({
      ...productDetail,
      images: images.map((image) =>
        this.productImageRepository.create({ url: image }),
      ),
    });
    await this.productRepository.save(product).catch(this.handleDBExecptions);

    return { ...product, images };
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, offset } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return products.map(({ images, ...rest }) => ({
      ...rest,
      images: images.map((image) => image.url),
    }));
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title) =UPPER(:title) or slug =LOWER(:slug)', {
          title: term,
          slug: term,
        })
        .leftJoinAndSelect('prod.images', 'images')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with #${term} not found`);
    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map((image) => image.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...onUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id,
      ...onUpdate,
    });

    if (!product) throw new NotFoundException(`Product with #${id} not found`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // if (images) {
      //   const productImages = await this.productImageRepository.find({
      //     where: { product },
      //   });

      //   await this.productImageRepository.remove(productImages);

      //   product.images = images.map((image) =>
      //     this.productImageRepository.create({ url: image }),
      //   );
      // }

      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        );
      }

      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // await this.productRepository.save(product);
      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExecptions(error);
    }
  }

  async remove(id: string) {
    const productId = await this.findOne(id);
    await this.productRepository.remove(productId);
  }

  async deleteAllProdructs() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExecptions(error);
    }
  }

  private handleDBExecptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException('Ayudaa!');
  }
}
