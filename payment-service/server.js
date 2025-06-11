const express = require('express');
const amqp = require('amqplib');

const app = express();

const RABBITMQ_URL = 'amqp://rabbitmq';

async function connectWithRetry() {
  const RETRY_INTERVAL = 5000;

  while (true) {
    try {
      const connection = await amqp.connect('amqp://rabbitmq');
      const channel = await connection.createChannel();

      const queue = 'order_created';
      const paymentQueue = 'payment_processed';
      await channel.assertQueue(queue, { durable: false });

      console.log('📬 Payment Service kuyruğu dinliyor...');

      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const order = JSON.parse(msg.content.toString());
          console.log('💳 Yeni sipariş ödemesi alındı:', order);

          paymentResult = {
            orderId: order.id,
            status: 'pending',
            amount: order.price,
            currency: order.currency
          }

         channel.sendToQueue(paymentQueue, Buffer.from(JSON.stringify(paymentResult)));
        

          setTimeout(() => {
            console.log('💳 Ödeme işleme alındı:', paymentResult);
            channel.ack(msg);
          }, 1000);
        }
      });

      break; 

    } catch (err) {
      console.error('❌ RabbitMQ bağlantı hatası, yeniden deneniyor...', err.message);
      await new Promise(res => setTimeout(res, RETRY_INTERVAL));
    }
  }
}

connectWithRetry();