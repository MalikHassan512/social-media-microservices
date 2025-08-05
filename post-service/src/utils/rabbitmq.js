import amqplib from 'amqplib';
import logger from './logger.js';

let connection = null;
let channel = null;

const Exchange_NAME = 'post_exchange';

export const connectToRabbitMQ = async () => {
    try {
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(Exchange_NAME, 'topic', { durable: false });
        logger.info('Connected to RabbitMQ');
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
}

export const publishEvent = async (routingKey, message) => {
    if (!channel) {
        logger.error('Channel is not initialized');
        await connectToRabbitMQ();
        
    }

    try {
        const msgBuffer = Buffer.from(JSON.stringify(message));
        channel.publish(Exchange_NAME, routingKey, msgBuffer);
        logger.info(`Event published with routing key: ${routingKey}`);
    } catch (error) {
        logger.error('Error publishing event:', error);
        throw error;
    }
}
    
export const consumeEvent = async (routingKey, callback) => {
    if (!channel) {
        logger.error('Channel is not initialized');
        await connectToRabbitMQ();
    }

    try {
        const queue = await channel.assertQueue('', { exclusive: true });
        channel.bindQueue(queue.queue, Exchange_NAME, routingKey);
        
        channel.consume(queue.queue, (msg) => {
            if (msg !== null) {
                const messageContent = JSON.parse(msg.content.toString());
                callback(messageContent);
                channel.ack(msg);
            }
        });

        logger.info(`Listening for events with routing key: ${routingKey}`);
    } catch (error) {
        logger.error('Error consuming event:', error);
        throw error;
    }
}