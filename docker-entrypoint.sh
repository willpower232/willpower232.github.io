#!/bin/bash
set -e

if [ -f Gemfile ]; then
	bundle config set --local path '/site/vendor/cache'
	bundle install --retry 5 --jobs 20 --path=/site/vendor/cache
fi

exec "$@"
