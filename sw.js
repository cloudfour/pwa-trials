'use strict';

const version = '__VERSION__';
const cacheName = `${version}`;

/**
 * Load the JSON manifest of hashed asset paths;
 * Open the cache and add all assets;
 */
addEventListener('install', event => { //console.log(`${event.type} ${version}`);
  event.waitUntil(
    fetch('/rev-manifest.json') // TODO: avoid hard-coding path
      .then(res => {
        return Promise.all([
          caches.open(cacheName),
          res.json()
        ]);
      })
      .then(([cache, deps]) => {
        const paths = Object.keys(deps).map(key => deps[key]);
        return cache.addAll(paths);
      })
      .catch(err => console.warn(err))
      .then(skipWaiting())
  );
});

/**
 * Collect all of the cache keys that don't match the current version;
 * Delete those cache keys;
 */
addEventListener('activate', event => { //console.log(`${event.type} ${version}`);
  event.waitUntil(
    caches.keys()
      .then(keys => keys
        .filter(key => !key.startsWith(version))
        .map(key => caches.delete(key))
      )
      .then(deletions => Promise.all(deletions))
      .catch(err => console.warn(err))
      .then(clients.claim())
  );
});

/**
 * @TODO: implement
 * Inspect event request to determine if it needs handling.
 * Depending on the type of resource requested (image, page, etc.), do something.
 */
addEventListener('fetch', event => { //console.log(`[online: ${navigator.onLine}] fetch ${event.request.url}`);
  //
});

/**
 * @TODO: implement
 * Inspect event message to determine if it needs handling.
 * Depending on the type of message, do something.
 */
addEventListener('message', event => { //console.log(`${event.type} ${version}`);
  //
});

/**
 * @TODO: implement
 */
addEventListener('sync', event => { //console.log(`${event.type} ${version}`);
  //
});
