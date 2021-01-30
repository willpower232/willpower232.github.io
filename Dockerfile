FROM ruby:2.7-alpine

RUN apk add --no-cache build-base gcc bash cmake git

RUN gem install bundler -v "~>1.0" && gem install bundler jekyll

EXPOSE 80

WORKDIR /site

COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# entrypoint is always run when starting the container
# makes sure the current bundle is installed and a Gemfile is present
ENTRYPOINT [ "docker-entrypoint.sh" ]

CMD [ "bundle", "exec", "jekyll", "serve", "--force_polling", "-H", "0.0.0.0", "-P", "80" ]
