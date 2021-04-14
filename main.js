const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_BOT_TOKEN;

let bot;

if (process.env.NODE_ENV === "production") {
  bot = new TelegramBot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new TelegramBot(token, { polling: true });
}

bot.onText(/\/account (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const name = match[1];
  await screenshotAccount(name);
  fs.readFile("logo.png", (err, data) => {
    if (err) throw err;
    bot.sendPhoto(chatId, data);
    fs.unlinkSync("logo.png");
  });
});

const screenshotAccount = async (name) => {
  // const name = process.argv[2];
  const browser = await puppeteer.launch();
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
    path: "logo.png",
    clip: { x: x, y: y - 50, width: w + 20, height: h + 20 },
  });
  //   await element.screenshot({ path: "example.png" });

  await browser.close();
};
