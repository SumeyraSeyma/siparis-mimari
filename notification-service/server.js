const express = require('express');
const amqp = require('amqplib'); 
const Redis = require('ioredis');

const app = express();
const redis = new Redis({ host: 'redis' });

const RABBITMQ_URL = 'amqp://rabbitmq';


async function connectWithRetry() {
  const RETRY_INTERVAL = 5000;

  while (true) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();

      const queue = 'order_created';
      await channel.assertQueue(queue, { durable: false });

      console.log('📬 Bildirim servisi kuyruk dinliyor...');

      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const order = JSON.parse(msg.content.toString());
          console.log('📢 Yeni sipariş bildirimi alındı:', order);

          // Redis'e kaydet
          await redis.set(`last_order:${order.id}`, JSON.stringify(order));
          console.log(`📦 Redis'e kaydedildi: last_order:${order.id}`);

          channel.ack(msg);
        }
      });

      const queue1 = 'queue1';
      const queue2 = 'queue2';
      const queue3 = 'queue3';
  await channel.assertQueue(queue1, { durable: false });
    await channel.assertQueue(queue2, { durable: false });
    await channel.assertQueue(queue3, { durable: false });

  channel.consume(queue1, (msg) => {
    if (msg !== null) {
      console.log(`[Queue1] Mesaj alındı:`, msg.content.toString());
      channel.ack(msg);
    }
  });

        channel.consume(queue2, (msg) => {
    if (msg !== null) {
      console.log(`[Queue2] Mesaj alındı:`, msg.content.toString());
        channel.ack(msg);
    }
  }
        );

        channel.consume(queue3, (msg) => {
    if (msg !== null) {
      console.log(`[Queue3] Mesaj alındı:`, msg.content.toString());
        channel.ack(msg);   
    }
    }
        );

    

      const paymentQueue = 'payment_successful';
      await channel.assertQueue(paymentQueue, { durable: false });

      channel.consume(paymentQueue, async (msg) => {
        if (msg !== null) {
          const paymentInfo = JSON.parse(msg.content.toString());
          console.log('💰 Ödeme bildirimi alındı:', paymentInfo);

          await redis.set(`payment:${paymentInfo.orderId}`, JSON.stringify(paymentInfo));
          console.log(`📦 Redis'e kaydedildi: payment:${paymentInfo.orderId}`);

          channel.ack(msg);
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
