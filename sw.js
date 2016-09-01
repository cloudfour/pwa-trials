'use strict';

const version = '__VERSION__';
const cacheName = `${version}`;
const deps = [
  '/assets/main.css',
  '/assets/main.js'
];

addEventListener('install', event => { console.log(`${event.type} ${version}`);
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(deps))
      .catch(err => console.warn(err))
      .then(skipWaiting())
  );
});

addEventListener('activate', event => { console.log(`${event.type} ${version}`);
  event.waitUntil(
    caches.keys()
      .then(keys => keys
        .filter(key => !key.startsWith(version))
        .map(key => caches.delete(key))
      )
      .then(Promise.all)
      .catch(err => console.warn(err))
      .then(clients.claim())
  );
});

addEventListener('fetch', event => { console.log(event.request);
  //
});

addEventListener('message', event => { console.log(`${event.type} ${version}`);
  //
});

addEventListener('sync', event => { console.log(`${event.type} ${version}`);
  //
});
