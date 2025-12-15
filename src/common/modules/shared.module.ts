import { Global, Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserModule } from 'src/modules/user/user.module';

@Global()
@Module({
  imports: [UserModule, AuthModule],
  exports: [UserModule, AuthModule],
})
export class SharedModule {}
