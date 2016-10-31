'use strict';

console.log('Executing toolkit.js');

function onFontsLoaded () {
  document.documentElement.classList.add('fonts-loaded');
}

function getMeta (id) {
  return Array.from(document.head.querySelectorAll('meta'))
    .filter(meta => meta.name === id)
    .map(meta => meta.content);
}

function loadFonts (faces) {
  const fontsExist = faces.every(f => document.fonts.check(f));
  return fontsExist ? Promise.resolve(true) : Promise.all(
    faces.map(f => document.fonts.load(f))
  );
};

function elems (selector, context=document) {
  const results = context.querySelectorAll(selector);
  return Array.from(results);
}
