const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_BOT_TOKEN;
const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

let bot;

if (process.env.NODE_ENV === "production") {
  bot = new TelegramBot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new TelegramBot(token, { polling: true });
}

bot.onText(RegExp("/start"), (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "To use this bot, simply write '/account' followed by the github account.\nFor example /account Pythonen"
  );
});

bot.onText(RegExp("/help"), (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "To use this bot, simply write '/account' followed by the github account.\nFor example /account Pythonen"
  );
});

bot.onText(/\/account (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const name = match[1];
  await screenshotAccount(name);
  fs.readFile("screenshot.png", (err, data) => {
    if (err) throw err;
    bot.sendPhoto(chatId, data);
    fs.unlinkSync("screenshot.png");
  });
});

const screenshotAccount = async (name) => {
  const chromeOptions = {
    headless: true,
    defaultViewport: null,
    args: ["--incognito", "--no-sandbox", "--single-process", "--no-zygote"],
  };
  const browser = await puppeteer.launch(chromeOptions);
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`https://github.com/${name}`);
  await page.evaluate((el) => {
    const elem = document.querySelector(
      ".UnderlineNav.width-full.box-shadow-none"
    );
    elem.parentNode.removeChild(elem);
  });
  const element = await page.$(".border.py-2.graph-before-activity-overview");
  const box = await element.boundingBox();
  const x = box["x"];
  const y = box["y"];
  const w = box["width"];
  const h = box["height"];
  await page.screenshot({
    path: "screenshot.png",
    clip: { x: x, y: y - 50, width: w + 20, height: h + 20 },
  });

  await browser.close();
};

app.listen(PORT);

app.post("/" + bot.token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
