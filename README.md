Recto - Node.js Express-based web client

Prerequisites
-------------

Installing PM2
```$ npm install pm2 -g```

Install verso
See https://github.com/lcnetdev/verso

We use 'bibliomata' as a name for this particular application, so you may want to install everything in a common directory, e.g. {path}/bibliomata/

Installation
-------------
Navigate to your directory you created (e.g. /bibliomata).

```
$ git clone https://github.com/lcnetdev/recto.git
$ cd recto
$ npm install
$ sudo pm2 start server.js --name recto
```

To check:
```
$ sudo pm2 status
```

You should get a status screen (with a short uptime).

Save:

```
$ sudo pm2 save 
```

This will save a copy of the PM2 config in /root/.pm2/dump.pm2

To restart the cluster with the dump file:
```
$ sudo pm2 resurrect
```
