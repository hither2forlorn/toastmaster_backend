import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);

  try {
    await seeder.seed();
    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed!', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();