import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Kacper Rębosz 2025 Remitly Internship Task Solution';
  }
}
