# ---- Base Node ----
FROM node:carbon AS base
# Create app directory
WORKDIR /app
# Copy package list files
COPY package.json yarn.lock ./


# ---- Test ----
FROM base AS test
# copy files
COPY . .
# install dependencies
RUN yarn install
# Set env to test
ENV ENV=TEST
#run tests
RUN yarn test

# ---- Build ----
# Currently nothing to build 

# --- Release with Alpine ----
FROM base AS release
# copy project directory
COPY . .
# install packages without dev dependencies
RUN yarn install --prod=true
# define env varables for the release
ENV PORT=6010 \
    ENV=RELEASE \
    SALT_ROUNDS=5 \
    SECRET=FE29F4FEB75237244D2E5AD7FE2DAAD23850EED9001125F638CA53EB363AB346 \
    EXPIRE=2m
# expost the port to outisde
EXPOSE $PORT
# run the project
CMD ["yarn", "start"]