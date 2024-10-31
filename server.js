const axios = require("axios");
const { Telegraf } = require("telegraf");
const schedule = require("node-schedule");
const moment = require("moment-timezone");
require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Telegram bot is running");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const chatId = process.env.TELEGRAM_CHAT_ID;

const city = "Frankenthal";
const country = "DE";
const prayerApiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`;

const prayerNamesTr = {
    Fajr: "Sabah",
    Sunrise: "Güneş",
    Dhuhr: "Öğle",
    Asr: "İkindi",
    Maghrib: "Akşam",
    Isha: "Yatsı"
};

async function getPrayerTimes() {
    try {
        const response = await axios.get(prayerApiUrl);
        return response.data.data.timings;
    } catch (error) {
        console.error("Namaz vakitleri alınamadı:", error);
        return null;
    }
}

async function scheduleNotifications() {
    const prayerTimes = await getPrayerTimes();
    if (!prayerTimes) return;

    const timezone = "Europe/Berlin";
    const now = moment().tz(timezone);

    const notificationTimes = {
        Sabah: moment.tz(prayerTimes.Fajr, "HH:mm", timezone).subtract(15, "minutes"),
        Öğle: moment.tz(prayerTimes.Dhuhr, "HH:mm", timezone).subtract(15, "minutes"),
        İkindi: moment.tz(prayerTimes.Asr, "HH:mm", timezone).subtract(15, "minutes"),
        Akşam: moment.tz(prayerTimes.Maghrib, "HH:mm", timezone).subtract(15, "minutes"),
        Yatsı: moment.tz(prayerTimes.Isha, "HH:mm", timezone).subtract(15, "minutes")
    };

    Object.entries(notificationTimes).forEach(([prayerName, notificationTime]) => {
        if (notificationTime.isAfter(now)) {
            const message =
                prayerName === "Yatsı"
                    ? "Uyumadan önce Yatsı namazını kılmayı unutma!"
                    : `Dikkat! ${prayerName} namazı 15 dakika içinde çıkacak. Acele et!!!`;

            schedule.scheduleJob(notificationTime.toDate(), () => {
                bot.telegram.sendMessage(chatId, message);
            });

            console.log(`${prayerName} hatırlatma saati: ${notificationTime.format("HH:mm")}`);
        }
    });
}

bot.launch();

schedule.scheduleJob("0 0 * * *", scheduleNotifications);
scheduleNotifications();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("Namaz vakti bildirici bot çalışıyor.");
