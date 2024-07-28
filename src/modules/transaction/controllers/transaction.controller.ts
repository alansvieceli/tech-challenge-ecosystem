import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CreatePaymentDto } from '../dtos/payment.create.dto';
import { TransactionService } from '../services/transaction.service';

@Controller('transaction')
export class TransactionServiceController {
    constructor(private readonly transactionServicehealthService: TransactionService) {}

    @ApiTags('Transactions')
    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiBody({ type: CreatePaymentDto })
    async post(@Body() createPaymentDto: CreatePaymentDto): Promise<void> {
        await this.transactionServicehealthService.process(createPaymentDto);
    }
}