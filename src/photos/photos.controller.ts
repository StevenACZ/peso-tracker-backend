import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Query,
  UseGuards, 
  UseInterceptors,
  UploadedFile,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  uploadPhoto(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
  ) {
    return this.photosService.uploadPhoto(user.id, file, createPhotoDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('weightId') weightId?: string,
  ) {
    const weightIdNum = weightId ? parseInt(weightId) : undefined;
    return this.photosService.findAll(user.id, page, limit, weightIdNum);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.photosService.findOne(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.photosService.remove(id, user.id);
  }
}