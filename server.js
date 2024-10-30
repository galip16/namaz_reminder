const axios = require("axios");
const { Telegraf } = require("telegraf");
const schedule = require("node-schedule");
require("dotenv").config();

// Telegram botu oluşturma
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID; // Telegram grup ID'si

// API bağlantısı ve konfigürasyonu
const city = "Frankenthal";
const country = "DE"; // Almanya
const prayerApiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`;

// Namaz vakitlerini almak için fonksiyon
async function getPrayerTimes() {
    try {
        const response = await axios.get(prayerApiUrl);
        return response.data.data.timings;
    } catch (error) {
        console.error("Namaz vakitleri alınamadı:", error);
    }
}

// Namaz vakitlerine göre bildirim gönderme
async function scheduleNotifications() {
    const prayerTimes = await getPrayerTimes();
    if (!prayerTimes) return;

    const now = new Date();

    Object.entries(prayerTimes).forEach(([prayer, time]) => {
        const [hour, minute] = time.split(":");
        const prayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

        if (prayerTime > now) {
            const notificationTime = new Date(prayerTime.getTime() - 15 * 60000);

            schedule.scheduleJob(notificationTime, () => {
                bot.telegram.sendMessage(chatId, `Dikkat! ${prayer} vakti 15 dakika içinde girecek.`);
            });
        }
    });
}

// Botu başlatma
bot.launch();

// Günlük olarak namaz vakitlerini güncelleme ve bildirimleri ayarlama
schedule.scheduleJob("0 0 * * *", scheduleNotifications);
scheduleNotifications(); // İlk çalışma anında da çalıştır

console.log("Namaz vakti bildirici bot çalışıyor.");
