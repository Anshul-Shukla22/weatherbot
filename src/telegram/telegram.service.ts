import { Injectable, Logger } from '@nestjs/common';
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');

const TELEGRAM_TOKEN = "6930362335:AAGgjvc5_e4GZAxH9dCEw4Dye9RmwlR1d_U";
const OPENWEATHERMAP_API_KEY = "ea05f0b6617d998492f421c4335d3bba";

@Injectable()
export class TelegramService {
    private readonly bot: any;
    private logger = new Logger(TelegramService.name);
    
    constructor() {
        this.bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
        this.bot.on("message", this.onReceiveMessage.bind(this));
    }

    onReceiveMessage = (msg: any) => {
        const city = msg.text;
        this.getWeatherData(city)
            .then(weatherData => this.sendWeatherMessage(msg.chat.id, weatherData))
            .catch(error => this.handleError(msg.chat.id, error));
    }

    private getWeatherData(city: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`;

            request(url, (error: any, response: any, body: any) => {
                if (error) {
                    this.logger.error(error);
                    reject('Error fetching weather data');
                    return;
                }

                const weatherData = JSON.parse(body);
                if (weatherData.cod === 200) {
                    resolve(weatherData);
                } else {
                    reject(`Cannot find weather for ${city}`);
                }
            });
        });
    }

    private sendWeatherMessage(chatId: number, weatherData: any): void {
        const temperature = (weatherData.main.temp - 273.15).toFixed(2);
        const weatherDescription = weatherData.weather[0].description;

        this.bot.sendMessage(chatId, `Weather in ${weatherData.name}:`);
        this.bot.sendMessage(chatId, `Temperature: ${temperature}°C`);
        this.bot.sendMessage(chatId, `Description: ${weatherDescription}`);
    }

    private handleError(chatId: number, error: string): void {
        this.bot.sendMessage(chatId, `Error: ${error}`);
    }
}
