import {SQSClient, SendMessageCommand} from '@aws-sdk/client-sqs';
import {Context, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {proxy} from 'aws-serverless-fastify';
import fastify from 'fastify';
import xmlBodyParser from 'fastify-xml-body-parser';

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL ?? '';

const sqs = new SQSClient({
    region: 'eu-west-1',
});

const app = fastify({
    logger: true,
});

app.register(xmlBodyParser, {ignoreAttributes: false});

type YoutubePubSubPayload = {
    feed: {
        link: Array<{
            '@_rel': string;
            '@_href': string;
        }>;
        title: string;
        updated: string;
        entry: {
            id: string;
            'yt:videoId': string;
            'yt:channelId': string;
            title: string;
            link: {
                '@_rel': string;
                '@_href': string;
            };
            author: {
                name: string;
                uri: string;
            };
            published: string;
            updated: string;
        };
        '@_xmlns:yt': string;
        '@_xmlns': string;
    };
};

app.get<{
    Querystring: {
        'hub.challenge': string;
        'hub.topic': string;
        'hub.mode': string;
        'hub.lease_seconds': string;
    };
}>('/pubsub', async (request, reply) => {
    return reply.code(200).send(request.query['hub.challenge']);
});

app.post<{Body: YoutubePubSubPayload}>('/pubsub', async (request, reply) => {
    try {
        const cmd = new SendMessageCommand({
            MessageBody: JSON.stringify(request.body),
            QueueUrl: SQS_QUEUE_URL,
            MessageGroupId: 'youtube-queueer',
        });

        await sqs.send(cmd);

        return reply
            .code(200)
            .headers({'Content-Type': 'application/json'})
            .send({status: 200, message: 'ok'});
    } catch (err) {
        console.error('Failed sending message to SQS', err);

        return reply
            .code(400)
            .headers({'Content-Type': 'application/json'})
            .send({status: 400, message: 'bad request'});
    }
});

export async function handler(
    event: APIGatewayProxyEvent,
    context: Context,
): Promise<APIGatewayProxyResult> {
    return proxy(app, event, context);
}
