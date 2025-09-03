import amqplib from "amqplib";
import logger from "./logger.js";

let connection = null;
let channel = null;

const Exchange_NAME = "social-network-events";

export const connectToRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(Exchange_NAME, "topic", { durable: false });
    logger.info("Connected to RabbitMQ");
  } catch (error) {
    logger.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
};

export const consumeEvent = async (routingKey, callback) => {
  console.log("Consuming event with routing key:", routingKey);
  if (!channel) {
    logger.error("Channel is not initialized");
    await connectToRabbitMQ();
  }

  try {
    const queue = await channel.assertQueue("", { exclusive: true });
    channel.bindQueue(queue.queue, Exchange_NAME, routingKey);

    channel.consume(queue.queue, (msg) => {
      if (msg !== null) {
        try {
          const messageContent = JSON.parse(msg.content.toString());
          logger.info(`Received event with routing key: ${routingKey}`, {
            messageContent,
          });
          callback(messageContent);
          channel.ack(msg);
          logger.info(
            `Successfully processed event with routing key: ${routingKey}`
          );
        } catch (error) {
          logger.error(
            `Error processing event with routing key: ${routingKey}`,
            error
          );
          channel.nack(msg, false, false); // Reject message without requeue
        }
      }
    });

    logger.info(`Listening for events with routing key: ${routingKey}`);
  } catch (error) {
    logger.error("Error consuming event:", error);
    throw error;
  }
};
