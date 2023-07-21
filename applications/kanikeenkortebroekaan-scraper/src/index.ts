import {Context, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {proxy} from 'aws-serverless-fastify';
import * as Cheerio from 'cheerio';
import fastify from 'fastify';
import fetch from 'node-fetch';
import ResponseBuilder from './ResponseBuilder';

const BASE_URL = 'https://kanikeenkortebroekaan.nl/';

const app = fastify({
    logger: true,
});

app.get('/', async (_, reply) => {
    const builder = new ResponseBuilder(reply);
    return builder.success({
        application: 'kanikeenkortebroekaan-scraper',
        message: 'ok',
    });
});

app.get('/cani', async (_, reply) => {
    const builder = new ResponseBuilder(reply);

    try {
        const request = await fetch(BASE_URL);
        const response = await request.text();
        const ch = Cheerio.load(response);

        return builder.success({
            app: 'kanikeenkortebroekaan-scraper',
            message: 'ok',
            can_i: Boolean(ch('body').attr('class')?.includes('ja')),
            image: `${BASE_URL.substring(0, BASE_URL.length - 1)}${ch(
                '.main-image',
            )
                .children(':first')
                .attr('src')}`,
            temperature: ch('.temp').children(':first').text(),
            chance_of_rain: ch('.temp').children(':nth-child(2)').text(),
            credits: [
                {
                    'Timo Klok': [BASE_URL, 'https://www.timoklok.nl/'],
                    'Yannick Gregoire': [
                        BASE_URL,
                        'https://yannickgregoire.nl/',
                    ],
                    'Frank Bosma': [BASE_URL],
                    'Michiel ten Horn': [
                        'https://www.google.com/search?hl=en&q=%22michiel+ten+horn%22',
                    ],
                },
            ],
        });
    } catch (err) {
        return builder.error('Unknown error occurred.');
    }
});

export async function handler(
    event: APIGatewayProxyEvent,
    context: Context,
): Promise<APIGatewayProxyResult> {
    return proxy(app, event, context);
}
