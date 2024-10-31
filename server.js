const axios = require("axios");
const { Telegraf } = require("telegraf");
const schedule = require("node-schedule");
const moment = require("moment-timezone");
require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Basit bir endpoint, Render'ın aktif olduğunuzu anlaması için:
app.get("/", (req, res) => {
    res.send("Telegram bot is running");
});

// Sunucuyu başlatın
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Telegram botu oluşturma
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID; // Telegram grup ID'si

// API bağlantısı ve konfigürasyonu
const city = "Frankenthal";
const country = "DE"; // Almanya
const prayerApiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`;

// API'den gelen İngilizce vakit isimlerini Türkçe karşılıklarına çevirme
const prayerNamesTr = {
    Fajr: "Sabah",
    Sunrise: "Güneş",
    Dhuhr: "Öğle",
    Asr: "İkindi",
    Maghrib: "Akşam",
    Isha: "Yatsı"
};

// Namaz vakitlerine göre bildirim gönderme
async function getPrayerTimes() {
    try {
        const response = await axios.get(prayerApiUrl);
        return response.data.data.timings;
    } catch (error) {
        console.error("Namaz vakitleri alınamadı:", error);
    }
}

// Hatırlatma bildirimlerini planlama
async function scheduleNotifications() {
    const prayerTimes = await getPrayerTimes();
    if (!prayerTimes) return;

    const timezone = "Europe/Berlin";  // Berlin saat dilimi
    const now = moment().tz(timezone);

    const notificationTimes = {
        Sabah: moment.tz(prayerTimes.Sunrise, "HH:mm", timezone).subtract(15, "minutes"),
        Öğle: moment.tz(prayerTimes.Asr, "HH:mm", timezone).subtract(15, "minutes"),
        İkindi: moment.tz(prayerTimes.Maghrib, "HH:mm", timezone).subtract(15, "minutes"),
        Akşam: moment.tz(prayerTimes.Isha, "HH:mm", timezone).subtract(15, "minutes"),
        Yatsı: moment.tz("23:00", "HH:mm", timezone)
    };

    Object.entries(notificationTimes).forEach(([prayerName, notificationTime]) => {
        if (notificationTime.isAfter(now)) {
            const message =
                prayerName === "Yatsı"
                    ? "Uyumadan önce Yatsı namazını kılmayı unutma!"
                    : `Dikkat! ${prayerName} namazı 15 dakika içinde girecek.`;

            schedule.scheduleJob(notificationTime.toDate(), () => {
                bot.telegram.sendMessage(chatId, message);
            });

            console.log(`${prayerName} hatırlatma saati: ${notificationTime.format("HH:mm")}`);
        }
    });
}

// Botu başlatma
bot.launch();

// Günlük olarak namaz vakitlerini güncelleme ve bildirimleri ayarlama
schedule.scheduleJob("0 0 * * *", scheduleNotifications);
scheduleNotifications(); // İlk çalışma anında da çalıştır

console.log("Namaz vakti bildirici bot çalışıyor.");
