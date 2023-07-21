import {FastifyReply} from 'fastify';

export default class ResponseBuilder {
    private reply: FastifyReply;

    constructor(reply: FastifyReply) {
        this.reply = reply;
    }

    error(
        error = 'Bad Request',
        code = 400,
        headers = {'Content-Type': 'application/json'},
    ) {
        return this.reply
            .code(code)
            .headers(headers)
            .send({
                data: null,
                error,
                meta: {
                    app: 'kanikeenkortebroekaan-scraper',
                    message: 'bad request',
                    code,
                },
            });
    }

    success(
        data: Record<string, unknown>,
        code = 200,
        headers = {'Content-Type': 'application/json'},
    ) {
        return this.reply
            .code(code)
            .headers(headers)
            .send({
                data,
                error: null,
                meta: {
                    app: 'kanikeenkortebroekaan-scraper',
                    message: 'ok',
                    code,
                },
            });
    }
}
