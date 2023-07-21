import {Context, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {proxy} from 'aws-serverless-fastify';
import * as Cheerio from 'cheerio';
import fastify from 'fastify';
import fetch from 'node-fetch';
import ResponseBuilder from './ResponseBuilder';
import dayjs from 'dayjs';

const BASE_URL = 'https://duo.nl/';

const app = fastify({
    logger: true,
});

app.get('/', async (_, reply) => {
    const builder = new ResponseBuilder(reply);
    return builder.success({
        application: 'duo-scraper',
        message: 'ok',
    });
});

app.get('/stufi', async (_, reply) => {
    const builder = new ResponseBuilder(reply);

    try {
        const request = await fetch(BASE_URL);
        const response = await request.text();
        const ch = Cheerio.load(response);

        const days = parseInt(ch('.hint').text().trim().replace(/\D/g, ''));

        return builder.success({
            paid_in: days,
            paid_in_unit: 'days',
            paid_in_date: dayjs().add(days, 'days').toISOString(),
        });
    } catch (err) {
        return builder.error('Unknown error occurred.');
    }
});

app.get('/stufi/dates', async (_, reply) => {
    const builder = new ResponseBuilder(reply);

    try {
        const request = await fetch(BASE_URL + 'particulier/betaaldatums.jsp');
        const response = await request.text();
        const ch = Cheerio.load(response);

        return builder.success({
            dates: [...ch('.content ul li').map((_, elem) => ch(elem).text())],
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
