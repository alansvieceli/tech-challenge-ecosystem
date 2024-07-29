import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.headers['x-api-key'] as string;

        if (this.isValidApiKey(apiKey)) {
            return true;
        } else {
            throw new UnauthorizedException('Invalid API key');
        }
    }

    private isValidApiKey(apiKey: string): boolean {
        const validApiKey = this.configService.get<string>('API_KEY');
        return apiKey === validApiKey;
    }
}