const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');
const axios = require('axios');
require('dotenv').config(); 

const token = process.env.TOKEN;

const bot = new TelegramBot(token, {polling: false});

const groupId = process.env.GROUP_ID;

const getPrayerTimes = async () => {
  try {
    const response = await axios.get('https://api.aladhan.com/v1/timingsByCity', {
      params: {
        city: 'Frankenthal',
        country: 'Germany',
        method: 2 
      }
    });
    return response.data.data.timings;
  } catch (error) {
    console.error('Namaz vakitleri alınırken hata oluştu:', error);
    await bot.sendMessage(groupId, 'Namaz vakitleri alınırken hata oluştu. Lütfen kontrol edin.');
    return null;
  }
};

const schedulePrayerReminders = async () => {
  const timings = await getPrayerTimes();

  if (!timings) return; 

  const scheduleReminder = (time, message, minutesBefore) => {
    const prayerTime = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    prayerTime.setHours(hours);
    prayerTime.setMinutes(minutes - minutesBefore);

    schedule.scheduleJob(prayerTime, () => bot.sendMessage(groupId, message));
  };

  scheduleReminder(timings.Fajr, 'Sabah namazına 45 dakika kaldı.', 45);
  scheduleReminder(timings.Fajr, 'Sabah namazına 15 dakika kaldı.', 15);

  scheduleReminder(timings.Dhuhr, 'Öğle namazına 45 dakika kaldı.', 45);
  scheduleReminder(timings.Dhuhr, 'Öğle namazına 15 dakika kaldı.', 15);

  scheduleReminder(timings.Asr, 'İkindi namazına 45 dakika kaldı.', 45);
  scheduleReminder(timings.Asr, 'İkindi namazına 15 dakika kaldı.', 15);

  scheduleReminder(timings.Maghrib, 'Akşam namazına 45 dakika kaldı.', 45);
  scheduleReminder(timings.Maghrib, 'Akşam namazına 15 dakika kaldı.', 15);

  scheduleReminder(timings.Isha, 'Yatsı namazına 45 dakika kaldı.', 45);
  scheduleReminder(timings.Isha, 'Yatsı namazına 15 dakika kaldı.', 15);
};

schedulePrayerReminders();
