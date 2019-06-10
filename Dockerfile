FROM node:8-stretch
WORKDIR /server

# Include some common dependencies
RUN apt-get update && \
    apt-get -y install vim nano bsdmainutils && \
    mkdir /sandbox && \
    chown nobody:nogroup /sandbox && \
    chmod a+rwx /sandbox

# First copy the files that rarely change
COPY ./package.json ./server.js /server/
RUN npm install .

# Then copy the library that frequently change
COPY ./lib /server/lib/

# Copy the example
COPY ./example /server/example/

ENTRYPOINT [ "/usr/local/bin/node", "/server/server.js" ]
