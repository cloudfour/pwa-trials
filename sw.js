'use strict';

/**
 * Configuration
 * -------------
 */

const version = '0.1.0';
const cacheName = `cloudfour@${version}`;
const manifest = '/rev-manifest.json';
const offlinePage = '/offline';
const fallbackImage = '/blank.png';

const types = Object.freeze({
  iframe: Symbol('iframe'),
  image: Symbol('image'),
  script: Symbol('script'),
  stylesheet: Symbol('stylesheet')
});

const typesByExtension = new Map([
  ['css', types.stylesheet],
  ['js',  types.script],
  ['gif', types.image],
  ['jpg', types.image],
  ['png', types.image],
  ['svg', types.image]
]);

const routesByType = new Map([
  [types.iframe, fetchOnlineFirst],
  [types.image, fetchOfflineFirst],
  [types.script, fetchOfflineFirst],
  [types.stylesheet, fetchOfflineFirst],
  [undefined, fetchOnlineFirst]
]);

const fallbacks = new Map([
  [types.image, fallbackImage]
]);

const hosts = [
  'localhost',
  'cloudfour.com',
  '29comwzoq712ml5vj5gf479x-wpengine.netdna-ssl.com'
];

/**
 * These must all pass for a request to be handled.
 */
const fetchRules = [
  request => request.method === 'GET',
  request => {
    const url = request.url.split('://').pop(); // TODO: Nasty
    return hosts.some(host => url.startsWith(host));
  }
];

/**
 * These must all pass in order to show the offline page.
 */
const offlineRules = [
  () => navigator.onLine === false,
  request => request.mode === 'navigate'
];

/**
 * Fetch and cache strategy functions
 * ----------------------------------
 */

function readCache (request) {
  const options = {ignoreSearch: true};
  return caches.match(request, options);
}

function writeCache (name, request, response) {
  caches.open(name).then(
    cache => cache.put(request, response)
  );
  return response.clone();
}

function fetchUpdate (request) {
  return fetch(request).then(response => {
    return isGoodResponse(response) ?
      writeCache(cacheName, request, response) : response;
  });
}

function fetchOnlineFirst (request) {
  return fetchUpdate(request).then(response => {
    return isGoodResponse(response) ?
      response : readCache(request)
  });
}

function fetchOfflineFirst (request) {
  return readCache(request).then(
    response => response || fetchUpdate(request)
  );
}

function fetchFastest (request) {
  return Promise.race([
    fetchUpdate(request),
    readCache(request)
  ]);
}

/**
 * Cache management functions
 * --------------------------
 */

function deleteCaches (filter) {
  return caches.keys()
    .then(keys => filter ? keys.filter(filter) : keys)
    .then(keys => keys.map(key => caches.delete(key)))
    .then(deletions => Promise.all(deletions));
}

function matchFallback (type) {
  const fallback = fallbacks.get(type);
  return fallback ?
    readCache(fallback) :
    Promise.resolve(new Response())
}

/**
 * Utility functions
 * -----------------
 */

function getExtension (subject) {
  const {pathname} = new URL(subject.url);
  const [extension] = pathname.match(/(?!\.)\w+$/i) || [];
  return extension;
}

function fetchJSON (request) {
  return fetch(request)
    .then(response => response.json());
}

function fetchObject (request) {
  return fetchJSON(request)
    .catch(() => ({}));
}

function fetchArray (request) {
  return fetchJSON(request)
    .catch(() => ([]));
}

function isGoodResponse (response) {
  return response && response.ok;
}

function testAll (rules, result, subject) {
  return rules.every(rule => rule(subject) === result);
}

function testAny (rules, result, subject) {
  return rules.some(rule => rule(subject) === result);
}

/**
 * Service worker event handlers
 * -----------------------------
 */

/**
 * Installation event handling
 */
addEventListener('install', event => {
  const dependencies = fetchObject(manifest)
    .then(data => Object.values(data))
    .then(vals => vals.concat(offlinePage, fallbackImage));

  return event.waitUntil(
    Promise.all([caches.open(cacheName), dependencies])
      .then(([cache, urls]) => cache.addAll(urls))
      .then(skipWaiting())
  );
});

/**
 * Activate event handling
 */
addEventListener('activate', event => {
  deleteCaches(name => name !== cacheName);
  return event.waitUntil(
    clients.claim()
  );
});

/**
 * Fetch event handling
 */
addEventListener('fetch', event => {
  const request = event.request;

  // If we should serve the offline page
  if (testAll(offlineRules, true, request)) {
    event.preventDefault();
    return event.respondWith(
      readCache(offlinePage)
    );
  }

  // If we should handle this as a subresource request
  if (testAll(fetchRules, true, request)) {
    const extension = getExtension(request);
    const type = typesByExtension.get(extension);
    const route = routesByType.get(type);
    const fallback = matchFallback(type);

    event.preventDefault();
    return event.respondWith(
      route(request)
        .then(response => isGoodResponse(response) ? response : fallback)
        .catch(() => fallback)
    );
  }
});

/**
 * Message event handling
 */
addEventListener('message', event => {
  clients.get(event.source.id)
    .then(client => client.postMessage(event.data));
});


/**
 * Debugging
 * ---------
 */

['install', 'activate', 'fetch', 'message', 'sync'].forEach(type => {
  addEventListener(type, console.log.bind(console));
})
