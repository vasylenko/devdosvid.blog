FROM ruby:2.6.4
WORKDIR /src
RUN apt-get update -y \
  && apt-get install -y locales \
  && echo "en_US UTF-8" > /etc/locale.gen \
  && locale-gen en_US.UTF-8 
COPY Gemfile Gemfile.lock ./
RUN gem install bundler:2.1.4 && bundle install
RUN rm -rf /var/cache/apt/archives