FROM ruby:2.6.4
WORKDIR /src

#This is needed to build some pesky themes with sass, just like my current one ^_^
RUN apt-get update -y \
  && apt-get install -y locales \
  && echo "en_US UTF-8" > /etc/locale.gen \
  && locale-gen en_US.UTF-8 
ENV LANG="en_US.UTF-8" LANGUAGE="en_US:en" LC_ALL="en_US.UTF-8"

#Bake all the dependiencies needed for website
COPY Gemfile Gemfile.lock ./
RUN gem install bundler:2.1.4 \
  && bundle install \
  && rm -rf /var/cache/apt/archives