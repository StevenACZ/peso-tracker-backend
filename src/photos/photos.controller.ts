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
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { GetPhotosQueryDto } from './dto/get-photos-query.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Photos')
@ApiBearerAuth()
@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Subir una foto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de foto y datos asociados',
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
        weightId: {
          type: 'integer',
          example: 1,
        },
        notes: {
          type: 'string',
          example: 'Foto de progreso semanal',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'La foto ha sido subida exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  uploadPhoto(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
  ) {
    return this.photosService.uploadPhoto(user.id, file, createPhotoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las fotos del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fotos.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  findAll(
    @CurrentUser() user: { id: number },
    @Query() query: GetPhotosQueryDto,
  ) {
    return this.photosService.findAll(user.id, query.page, query.limit, query.weightId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una foto por ID' })
  @ApiResponse({
    status: 200,
    description: 'La foto.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Foto no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.photosService.findOne(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una foto' })
  @ApiResponse({
    status: 200,
    description: 'La foto ha sido eliminada exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Foto no encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.photosService.remove(id, user.id);
  }
}
