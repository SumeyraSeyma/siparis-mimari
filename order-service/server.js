const express = require("express");
const amqp = require("amqplib");

const app = express();
app.use(express.json());

const RABBITMQ_URL = "amqp://rabbitmq";

async function sendToQueue(order) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  const queue = "order_created";
  const queue1 = "queue1";
  const queue2 = "queue2";
  const queue3 = "queue3";
  const exchange = "fanout_exchange";

  await channel.assertExchange(exchange, "fanout", { durable: false });

  await channel.assertQueue(queue, { durable: false });
  await channel.assertQueue(queue1, { durable: false });
  await channel.assertQueue(queue2, { durable: false });
  await channel.assertQueue(queue3, { durable: false });

  await channel.bindQueue(queue1, exchange, "");
  await channel.bindQueue(queue2, exchange, "");
  await channel.bindQueue(queue3, exchange, "");

  await channel.publish(exchange, "", Buffer.from(JSON.stringify(order)));

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(order)));
  console.log("Sipariş kuyruğa gönderildi:", order);

  setTimeout(() => {
    connection.close();
  }, 500);
}

app.post("/order", async (req, res) => {
  const order = req.body;
  await sendToQueue(order);
  res.status(201).send({ message: "Sipariş alındı", order });
});

app.listen(3001, () => {
  console.log("🛒 Order Service çalışıyor: http://localhost:3001");
});
