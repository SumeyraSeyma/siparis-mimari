const express = require("express");
const amqplib = require("amqplib");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: "mailhog",
  port: 1025,
  secure: false,
});

const RABBITMQ_URL = "amqp://rabbitmq";
async function connectWithRetry() {
  const RETRY_INTERVAL = 5000;

  while (true) {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();

      const queue = "queue1";
      await channel.assertQueue(queue, { durable: false });

      console.log("📬 Mail Servisi kuyruğu dinliyor...");

      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const order = JSON.parse(msg.content.toString());
          console.log("📧 Yeni ödeme bildirimi alındı:", order);

          const mailOptions = {
            from: "shop@example.com",
            to: order.email || "test@example.com",
            subject: "Sipariş Onayı",
            text: `Merhaba ${order.name}, siparişiniz alındı! ID: ${order.id}`,
          };

          try {
            await transporter.sendMail(mailOptions);
            console.log("✅ Mail gönderildi:", mailOptions.to);
            channel.ack(msg);
          } catch (err) {
            console.error("❌ Mail gönderme hatası:", err.message);
          }
        }
      });

      break; 
    } catch (err) {
      console.error(
        "❌ RabbitMQ bağlantı hatası, yeniden deneniyor...",
        err.message
      );
      await new Promise((res) => setTimeout(res, RETRY_INTERVAL));
    }
  }
}

connectWithRetry();
