'use strict';

class FetchHandler {
  /**
   * Fetch something, cache the response, then return a clone of that response.
   */
  static passThru (request) {
    return fetch(request)
      .then(response => {
        return isGoodResponse(response) ?
          putCache(cacheName, request, response) :
          response;
      });
  }

  /**
   * Return a cached response, ignoring query strings in its URL.
   */
  static matchFuzzy (request) {
    return caches.match(request, {ignoreSearch: true});
  }

  /**
   * Return a cached response if possible, otherwise fetch it from the
   * network (and also cache the new response).
   */
  static offlineFirst (request) {
    return FetchHandler.matchFuzzy(request)
      .then(response => response || FetchHandler.passThru(request))
  }

  /**
   * Fetch a response from the network if possible, otherwise find and
   * return a cached version.
   */
  static onlineFirst (request) {
    return FetchHandler.passThru(request)
      .then(response => {
        return isGoodResponse(response) ?
          response :
          FetchHandler.matchFuzzy(request)
      });
  }

  /**
   * Fetch a response from the network and from the cache, and return whichever
   * one resolves first (while also updating the cache with a fresh response).
   */
  static fastest (request) {
    return Promise.race([
      FetchHandler.passThru(request),
      FetchHandler.matchFuzzy(request)
    ]);
  }
}

const fetchOptions = {
  shell: {cache: 'no-store'}
};
const version = '0.1.0';
const cacheName = `cloudfour@${version}`;
const manifest = new Request('/rev-manifest.json', fetchOptions.shell);
const offlinePage = new Request('/offline.html', fetchOptions.shell);
const fallbackImage = new Request('/assets/image.gif', fetchOptions.shell);

const resourceType = Object.freeze({
  iframe: Symbol('iframe'),
  image: Symbol('image'),
  script: Symbol('script'),
  stylesheet: Symbol('stylesheet')
});

const typesByExtension = new Map([
  ['css', resourceType.stylesheet],
  ['js',  resourceType.script],
  ['gif', resourceType.image],
  ['jpg', resourceType.image],
  ['png', resourceType.image],
  ['svg', resourceType.image]
]);

const routesByType = new Map([
  [resourceType.iframe, FetchHandler.onlineFirst],
  [resourceType.image, FetchHandler.offlineFirst],
  [resourceType.script, FetchHandler.offlineFirst],
  [resourceType.stylesheet, FetchHandler.offlineFirst],
  [undefined, FetchHandler.onlineFirst]
]);

const fallbacks = new Map([
  [resourceType.image, fallbackImage]
]);

/**
 * These must all pass for a request to be handled.
 */
const fetchRules = [
  request => request.method === 'GET',
  request => {
    const {referrer} = request;
    return !referrer.length || referrer.startsWith(registration.scope)
  }
];

/**
 * These must all pass in order to show the offline page.
 */
const offlineRules = [
  () => navigator.onLine === false,
  request => request.mode === 'navigate'
];

function getExtension (subject) {
  const {pathname} = new URL(subject.url);
  const [extension] = pathname.match(/(?!\.)\w+$/i) || [];
  return extension;
}

function fetchData (request) {
  return fetch(request)
    .then(response => response.json());
}

function deleteCaches (filter) {
  return caches.keys()
    .then(keys => filter ? keys.filter(filter) : keys)
    .then(keys => keys.map(key => caches.delete(key)))
    .then(deletions => Promise.all(deletions));
}

function putCache (name, request, response) {
  caches.open(name)
    .then(cache => cache.put(request, response));
  return response.clone();
}

function matchFallback (type) {
  const fallback = fallbacks.get(type);
  return fallback ?
    caches.match(fallback) :
    Promise.resolve(new Response())
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
 * Installation event handling
 */
addEventListener('install', event => {
  console.log(event);
  return event.waitUntil(
    Promise.all([caches.open(cacheName), fetchData(manifest)])
      .then(([cache, data]) => {
        const shellRequests = Object.values(data);
        return cache.addAll(
          shellRequests.concat(offlinePage, fallbackImage)
        );
      })
      .then(skipWaiting())
  );
});

/**
 * Activate event handling
 */
addEventListener('activate', event => {
  console.log(event);
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
  const shouldCancel = testAll(offlineRules, true, request);
  const shouldHandle = testAll(fetchRules, true, request);

  if (shouldCancel) {
    event.preventDefault();
    return event.respondWith(
      caches.match(offlinePage)
    );
  }

  if (shouldHandle) {
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
  console.log(event);
  clients.get(event.source.id)
    .then(client => client.postMessage(event.data));
});

/**
 * Sync event handling
 */
addEventListener('sync', event => {
  console.log(event);
});
