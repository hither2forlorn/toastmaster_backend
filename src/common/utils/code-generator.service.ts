import { Injectable } from '@nestjs/common';
@Injectable()
export class CodeGeneratorService {
  generatePrefix(name: string): string {
    if (!name) return 'CLB';
    const words = name.split(' ').filter((w) => w.length > 0);
    let prefix = words.map((w) => w[0].toUpperCase()).join('');
    if (prefix.length > 3) prefix = prefix.substring(0, 3);
    return prefix;
  }

  generateClubCodeFromName(name: string): string {
    const prefix = this.generatePrefix(name);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`;
  }

  async generateUnique(
    name: string,
    validate: (code: string) => Promise<boolean>,
  ): Promise<string> {
    let code;
    let attempts = 0;

    do {
      if (++attempts > 10) throw new Error('Failed to generate unique code');
      code = this.generateClubCodeFromName(name);
    } while (!(await validate(code)));

    return code;
  }
}
