import { Global, Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserModule } from 'src/modules/user/user.module';
import { KeepAliveService } from '../services/keep-alive.service';
import { HealthController } from '../controllers/health.controller';

@Global()
@Module({
  imports: [UserModule, AuthModule],
  providers: [KeepAliveService],
  controllers: [HealthController],
  exports: [UserModule, AuthModule],
})
export class SharedModule {}
