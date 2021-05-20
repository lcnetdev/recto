# _Recto_ - Node.js Express-based web app server

## Introduction

_Recto_ is a web application server for use with the Library of 
Congress' [BIBFRAME editor](https://github.com/lcnetdev/bfe) and its 
related [profile editor](https://github.com/lcnetdev/profile-edit). It uses
[ldpjs](https://github.com/lcnetdev/ldpjs), which is basically a [Linked Data 
Platform](https://www.w3.org/TR/ldp/) API.

_Recto_ serves as the reference implementation of the Library of Congress' BIBFRAME cataloging environment.

## Getting started

_Recto_ is a [Node.js](https://nodejs.org/) application designed to be built and run with [npm](https://npmjs.com).

### Prerequisites

* [ldpjs](https://github.com/lcnetdev/ldpjs)

You can npm install `ldpjs`:

```bash
npm install git+https://github.com/lcnetdev/ldpjs.git
```

`ldpjs` requires MongoDB.  See the [ldpjs documentation](https://github.com/lcnetdev/ldpjs/blob/main/README.md) for 
more information about ldpjs.

* [Grunt](https://gruntjs.com/)

Required for building the profile editor submodule.

### Installation

_Recto_ includes both the BIBFRAME editor and the profile editor using git submodules. 
To install, create a directory for deployment, navigate to that directory, and then:

```
git clone --recursive https://github.com/lcnetdev/recto
cd recto
npm install
```

The bfe and profile editor submodules need to be built, as well:

```
cd bfe
npm install
grunt
cd ../profile-edit/source
npm install
grunt
```

The path to the profile editor may need to be updated in profile-edit/source/index.html:
```
<base href="/profile-edit/">
```

Similarly, the path to recto in bfe may need to be updated in the config files:
```
var rectoBase = "http://bibframe.org/bibliomata";
```

Finally, if using pm2 you can start recto with `npm start`, or for dev `npm run dev`

### Configuration

Many defaults in _Recto_, the bfe, and the profile editor are set up for the Library 
of Congress' BIBFRAME pilot. You can configure Recto for your local installation 
by making the following changes:

* In `profile-edit/source/index.html`, update the `<base>` tag to the base of your installation, e.g.:

```bash
<base href="/profile-edit/">
```

* In `bfe/static/js/config-dev.js`, update the value of the `rectoBase` variable 
(on or around line 248) to match your local installation, e.g.:

```bash
rectoBase = "http://localhost:3000";
```

For convenience, an npm script is included to run _Recto_ locally for development:

```bash
npm run local
```

### Running _Recto_

_Recto_ can run as an npm application with the usual `npm start` invocation. 
In addition, as noted above, a development server can be run with the 
command `npm run local`.

For a more production-ready deployment, you can use 
the [PM2 Process Manager](http://pm2.keymetrics.io/) to manage 
your _Recto_ process. To use pm2 to deploy _Recto_:

```
npm install pm2 -g
pm2 start server.js --name recto
```

To check the status of pm2 applications:

```
pm2 status
```

You should get a status screen (with a short uptime).

To save your pm2 runtime configuration:

```
pm2 save 
```

This will save a copy of the PM2 config in `~/.pm2/dump.pm2`.

To restart the cluster with the dump file:
```
pm2 resurrect
```

_Recto_ runs by default on port 3000.
