import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);
  private readonly isProduction: boolean;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';

    // Get the full API URL from environment or construct it
    const port = this.configService.get('PORT', 10000);
    const host = this.configService.get('HOST', '0.0.0.0');
    this.apiUrl =
      this.configService.get('KEEP_ALIVE_URL') || `http://localhost:${port}`;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleKeepAlive() {
    if (!this.isProduction) {
      return;
    }

    try {
      const startTime = Date.now();

      const response = await fetch(`${this.apiUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        this.logger.log(
          ` Keep-alive ping successful (${duration}ms) - Service staying awake`,
        );
      } else {
        this.logger.warn(` Keep-alive ping returned status ${response.status}`);
      }
    } catch (error) {
      this.logger.error(
        ` Keep-alive ping failed: ${error.message}`,
        error.stack,
      );
    }
  }

  // Optional: Manual ping method
  async ping() {
    this.logger.log(' Manual keep-alive ping triggered');
    await this.handleKeepAlive();
    return { message: 'Keep-alive ping sent' };
  }
}
