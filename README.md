# Firstly

`git submodule update --init` when you inevitably forget the submodules

`git submodule update --remote` to update the remote to the latest commit

# Initially

1. docker pull ghcr.io/willpower232/jekyll-toolkit

2. docker run -it --rm -v $(pwd):/site ghcr.io/willpower232/jekyll-toolkit jekyll new . --force

3. chown -R wh ./ && mkdir -p content && mv *.markdown *.html _posts content

4. append `source: content` to `_config.yml`

# Mostly

docker-compose up (don't daemon it so that you can watch the logs)

# More

Jekyll categories and tags https://blog.webjeda.com/jekyll-categories/

Cool tag tricks https://longqian.me/2017/02/09/github-jekyll-tag/

General Jekyll Hints https://devhints.io/jekyll

Jekyll variables https://jekyllrb.com/docs/variables/

Jekyll filters https://jekyllrb.com/docs/liquid/filters/

Liquid tags https://jekyllrb.com/docs/liquid/tags/

Instead of using seo plugin do this manually https://blog.webjeda.com/optimize-jekyll-seo/

## TODO

List of posts in tags/categories (https://kylewbanks.com/blog/creating-category-pages-in-jekyll-without-plugins)

Link from navigation to lists of posts (see linking in liquid tags...)

Refer to https://github.com/ronv/sidey

## Deploying

Unfortunately github pages isn't compatible with custom sources (the content folder) so I'm using a github action to build and commit the gh-pages branch.

References:
https://www.drinkingcaffeine.com/deploying-jekyll-to-github-pages-without-using-githubs-jekyll/
https://dev.to/rolanddoda/deploy-to-github-pages-like-a-pro-with-github-actions-4hdg
https://github.community/t/how-does-one-commit-from-an-action/16127/10
