FROM node:lts-alpine3.14

LABEL maintainer="420125423@qq.com"

COPY . /usr/local/code

WORKDIR /usr/local/code

RUN npm i -g cnpm --registry=https://registry.npm.taobao.org && \
cnpm i

CMD ["npm", "start"]