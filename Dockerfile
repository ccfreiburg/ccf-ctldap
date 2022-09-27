FROM node:18
LABEL authors="Alex Roehm"
# update dependencies and install curl
RUN apt-get update && apt-get install -y \
    curl dumb-init\
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /ldap
RUN chown 1000:1000 .

COPY --chown=node:node . . 

USER 1000:1000

# update each dependency in package.json to the latest version
ENV NODE_ENV=production
RUN yarn install --production

EXPOSE 1389
ENTRYPOINT [ "dumb-init", "node", "." ]
