# 🍋 lemon-squash.js

> Squeeze multiple interactive shell sessions into a tight space!

_Lemon squash.js_ is composed of a web-server and an embeddable javascript component that can be used to establish multiple, isolated terminal sessions into a single container. This is mainly intended for interactive guides and similar educational material, but could also be used in other places too!

# Usage

The server logic is implemented in the `lib/ServerSession.js` file. An example server implementation using express.js can be found on `server.js`

You can build a docker image and give it a try yourself using:

```
~$ docker build -t lemon-squash:latest .
~$ docker run -it --rm -p 8080:8080 --privileged lemon-squash:latest
```

And then openning your browser on http://127.0.0.1:8080

**IMPORTANT** The lightweight containerization requires bind-mounting permissions. Therefore it must be launched with `--privileged` (or with the respective CGroup permissions).

