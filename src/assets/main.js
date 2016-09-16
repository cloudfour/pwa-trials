'use strict';

if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const form = document.querySelector('form');
  const reloadButton = document.getElementById('reload');

  sw.register('/sw.js').then(reg => {
    console.log(reg);
  });

  sw.addEventListener('controllerchange', event => {
    console.log(event);
  });

  sw.addEventListener('message', event => {
    console.log(event);
  });

  addEventListener('online', event => {
    console.log(event);
  });

  addEventListener('offline', event => {
    console.log(event);
  });

  if (form) {
    form.addEventListener('submit', event => {
      console.log(event);
      sw.controller.postMessage(new FormData(event.target).get('msg'));
      event.preventDefault();
    });
  }

  if (reloadButton) {
    reloadButton.addEventListener('click', event => {
      Array.from(document.querySelectorAll('link[rel=stylesheet]')).forEach((item, index, arr) => {
        const el = arr[index];
        const clone = el.cloneNode();
        el.replaceWith(clone);
      });
    });
  }
}
