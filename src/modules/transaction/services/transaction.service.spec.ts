import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQProducerService } from '@modules/rabbitmq/services/rabbitmq.producer.services';
import { RabbitMQHeaderType } from '@/modules/rabbitmq/enums/rabbitmq.header.type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PayablesStatus } from '../enums/payables-status.enum';
import { TransactionService } from './transaction.service';
import { CreatePaymentDto } from '../dtos/payment.create.dto';
import { CreatePayablesDto } from '../dtos/payables.create.dto';
import { format } from 'date-fns';

describe('TransactionService', () => {
    let service: TransactionService;
    let rabbitMQProducerService: RabbitMQProducerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionService,
                {
                    provide: RabbitMQProducerService,
                    useValue: {
                        sendMessage: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TransactionService>(TransactionService);
        rabbitMQProducerService = module.get<RabbitMQProducerService>(RabbitMQProducerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('process', () => {
        it('should send a message to RabbitMQ', async () => {
            const createPaymentDto: CreatePaymentDto = {
                total: 100,
                merchantId: 1,
                description: 'Test payment',
                paymentMethod: PaymentMethod.DEBIT_CARD,
                cardNumber: '1234',
                cardHolder: 'John Doe',
                cardExpirationDate: '12/2023',
                cardCVV: '123',
            };

            const expectedPayables: CreatePayablesDto = {
                merchantId: 1,
                status: PayablesStatus.PAID,
                createDate: expect.any(String),
                subtotal: 100,
                discount: 2,
                total: 98,
            };

            await service.process(createPaymentDto);

            expect(rabbitMQProducerService.sendMessage).toHaveBeenCalledWith(
                {
                    payment: createPaymentDto,
                    payables: expectedPayables,
                },
                RabbitMQHeaderType.TRANSACTION,
            );
        });
    });

    describe('createPayables', () => {
        it('should create a payables for a debit card payment', () => {
            const createPaymentDto: CreatePaymentDto = {
                total: 100,
                merchantId: 1,
                description: 'Test payment',
                paymentMethod: PaymentMethod.DEBIT_CARD,
                cardNumber: '1234',
                cardHolder: 'John Doe',
                cardExpirationDate: '12/2023',
                cardCVV: '123',
            };

            const payables = service['createPayables'](createPaymentDto);

            expect(payables).toEqual({
                merchantId: 1,
                status: PayablesStatus.PAID,
                createDate: expect.any(String),
                subtotal: 100,
                discount: 2,
                total: 98,
            });
        });

        it('should create a payables for a credit card payment', () => {
            const createPaymentDto: CreatePaymentDto = {
                total: 100,
                merchantId: 1,
                description: 'Test payment',
                paymentMethod: PaymentMethod.CREDIT_CARD,
                cardNumber: '1234',
                cardHolder: 'John Doe',
                cardExpirationDate: '12/2023',
                cardCVV: '123',
            };

            const payables = service['createPayables'](createPaymentDto);

            expect(payables).toEqual({
                merchantId: 1,
                status: PayablesStatus.WAITING_FUNDS,
                createDate: expect.any(String),
                subtotal: 100,
                discount: 4,
                total: 96,
            });
        });
    });

    describe('calculateProcessingFee', () => {
        it('should calculate the correct processing fee', () => {
            const { discount, total } = service['calculateProcessingFee'](100, 4);
            expect(discount).toBe(4);
            expect(total).toBe(96);
        });
    });
});
