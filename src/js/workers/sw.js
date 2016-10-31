'use strict';

importScripts('https://cdnjs.cloudflare.com/ajax/libs/ramda/0.22.1/ramda.min.js');

/**
 * Configuration
 * -------------
 */

const config = {
  /*
   * Caches will be prefixed with this.
   */
  cacheName: 'cloudfour',
  /**
   * Request URLs must match these path patterns to be handled. The scope of the
   * service worker itself will implicitly be added to this list.
   */
  knownHosts: [
    '29comwzoq712ml5vj5gf479x-wpengine.netdna-ssl.com',
    'cdn.polyfill.io',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ],
  /**
   * Request URLs must not match these path patterns to be handled. The location
   * of the service worker itself will implicitly be added to this list.
   */
  fetchIgnored: [
    '/wp-content/uploads/',
    '/wp-admin',
    '/wp-login.php',
    'preview=true'
  ],
  /**
   * Responses must have content-type headers matching these substrings in order
   * for them to be cached.
   * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
   */
  cacheAllowed: [
    'font',
    'js',
    'javascript',
    'pdf',
    'image',
    'css',
    'html'
  ],

  imageExtensions: [
    '.gif',
    '.jpg',
    '.png',
    '.svg',
    '.webp'
  ],

  /**
   * These will be cached during installation. The build process will convert
   * any keys from rev-manifest.json to the corresponding file path.
   * The registration scope (e.g. '/') will be implicitly added to the list.
   */
  dependencies: [
    '/error.html',
    '/offline.html',
    '/assets/blank.png'     // => /assets/blank-abc123xyz.png
  ],
  /**
   * This will be served as a fallback page response if:
   * a) the network errors
   * b) no cached match can be found
   * This must also be present in `dependencies`.
   */
  fallbackPage: '/offline.html',

  errorPage: '/error.html',
  /**
   * This will be served as a fallback image response if:
   * a) no cached match can be found
   * b) the network returns a 404
   * c) the network errors
   * This must also be present in `dependencies`. The build process will convert
   * any keys from rev-manifest.json to the corresponding file path.
   */
  fallbackImage: '/assets/blank.png', // => /assets/blank-abc123xyz.png
  /**
   * Post message to clients when offline.
   */
  notifyOffline: true,
  /**
   * Post message to clients when cache is appended.
   */
  notifyCached: true
};

const version = '0.1.3';
const cacheName = `${config.cacheName}@${version}`;
const localBase = `${location.origin}/`;

/**
 *
 */

const endsWith = R.invoker(1, 'endsWith');
const startsWith = R.invoker(1, 'startsWith');
const log = R.bind(console.log, console);

/**
 * Cache management functions
 * --------------------------
 */

const cachesDelete = R.bind(caches.delete, caches);
const cachesKeys = R.bind(caches.keys, caches);
const cachesMatch = R.bind(caches.match, caches);
const cachesOpen = R.bind(caches.open, caches);

/**
 *
 */
const fetchJSON = R.pipeP(fetch, res => res.json());
const fetchKeys = R.pipeP(fetchJSON, R.keys);
const fetchVals = R.pipeP(fetchJSON, R.values);

/**
 *
 */
const errorResponse = () => Response.error();
const errorPage = () => cachesMatch(config.errorPage);
const fallbackPage = () => cachesMatch(config.fallbackPage);
const fallbackImage = () => cachesMatch(config.fallbackImage);

/**
 * Utility functions
 * -----------------
 */

const hasOk = R.propEq('ok', true);
const has404Status = R.propEq('status', 404);
const hasGetMethod = R.propEq('method', 'GET');
const hasNavMode = R.propEq('mode', 'navigate');
const isImageUrl = R.anyPass(R.map(endsWith, config.imageExtensions));
const hasImageUrl = R.propSatisfies(isImageUrl, 'url');
const hasLocalUrl = R.propSatisfies(startsWith(localBase), 'url');

const isBadResponse = R.allPass([
  R.complement(hasOk),
  R.complement(has404Status)
]);

const is404Image = R.allPass([
  has404Status,
  hasImageUrl
]);

/**
 *
 */
const handleResponse = (...conditions) => R.cond([
  ...conditions,
  [R.T, res => res]
]);

/**
 *
 */
function fetchPage (request) {
  const promise = R.pipeP(
    fetch,
    handleResponse(
      [isBadResponse, errorPage]
    )
  );
  return promise(request)
    .catch(fallbackPage);
}

/**
 *
 */
function matchAsset (request) {
  const promise = R.pipeP(
    cachesMatch,
    res => res || fetch(request),
    handleResponse(
      [is404Image, fallbackImage],
      [isBadResponse, errorResponse]
    )
  );
  return promise(request)
    .catch(errorResponse);
}

/**
 * Service worker event handlers
 * -----------------------------
 */

/**
 * Installation event handling
 */

oninstall = event => {
  const deps = [registration.scope, ...config.dependencies];
  const precache = R.pipeP(
    cachesOpen,
    cache => cache.addAll(deps)
  );
  skipWaiting();
  event.waitUntil(
    precache(cacheName)
  );
};

/**
 * Activation event handling
 */

onactivate = event => {
  const expired = R.complement(R.equals(cacheName));
  const cleanup = R.pipeP(
    cachesKeys,
    R.filter(expired),
    R.map(key => cachesDelete(key)),
    del => Promise.all(del)
  );
  event.waitUntil(cleanup());
};

/**
 * Fetch event handling
 */

onfetch = event => {
  event.respondWith(fetch(event.request), {mode: event.request.mode});
};

// nonfetch = event => {
//   const request = event.request;
//   const routeMap = new Map([
//     ['navigate', fetchPage],
//     ['no-cors', matchAsset]
//   ]);
//   const route = routeMap.get(request.mode);
//
//   console.log(`${request.mode}: ${request.url}`);
//   if (route) {
//     event.respondWith(route(request));
//     event.preventDefault();
//   }
// };

/**
 * Debugging
 * ---------
 */
