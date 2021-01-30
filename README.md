Source: https://github.com/BretFisher/jekyll-serve

1. docker build -t jekyll-toolkit .

2. docker run -it --rm -v $(pwd):/site jekyll-toolkit jekyll new . --force

3. chown -R wh ./ && mkdir -p content && mv *.markdown *.html _posts content

4. append `source: content` to `_config.yml`

5. docker-compose up (don't daemon it so that you can watch the logs)

6. docker run -it --rm -v $(pwd):/site ruby:2.7-alpine sh
   run the commands from the dockerfile to set up bundler
   replace the lockfile with `bundle install`

