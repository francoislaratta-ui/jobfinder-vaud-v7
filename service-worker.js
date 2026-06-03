/* ==========================================
JOB FINDER VAUD V14.0.0 PREMIUM IA
SERVICE WORKER
Créateur : F. Laratta
========================================== */

const CACHE_NAME =
"jobfinder-vaud
-v14.0.0";

/* ==========================================
FICHIERS A METTRE EN CACHE
========================================== */

const urlsToCache = [

"/",

"/index.html",

"/style.css",

"/app.js",

"/offers.json",

"/manifest.json",

"/favorites.json",

"/candidatures.json",

"/assets/icon-192.png",

"/assets/icon-512.png"

];

/* ==========================================
INSTALLATION
========================================== */

self.addEventListener(
"install",
event => {

event.waitUntil(

caches.open(
CACHE_NAME
)

.then(cache => {

console.log(
"Cache installé"
);

return cache.addAll(
urlsToCache
);

})

);

self.skipWaiting();

}
);

/* ==========================================
ACTIVATION
========================================== */

self.addEventListener(
"activate",
event => {

event.waitUntil(

caches.keys()

.then(keys => {

return Promise.all(

keys.map(key => {

if(
key !== CACHE_NAME
){

return caches.delete(
key
);

}

})

);

})

);

self.clients.claim();

}
);
/* ==========================================
FETCH
========================================== */

self.addEventListener(
"fetch",
event => {

event.respondWith(

caches.match(
event.request
)

.then(response => {

if(response){

return response;

}

return fetch(
event.request
)

.then(networkResponse => {

if(
!networkResponse
||
networkResponse.status !== 200
||
networkResponse.type !== "basic"
){

return networkResponse;

}

const responseToCache =
networkResponse.clone();

caches.open(
CACHE_NAME
)

.then(cache => {

cache.put(
event.request,
responseToCache
);

});

return networkResponse;

})

.catch(() => {

return caches
 match(
"/index.html"
);

});

})

);

}
);

/* ==========================================
MESSAGE
========================================== */

self.addEventListener(
"message",
event => {

if(
event.data &&
event.data.type ===
"SKIP_WAITING"
){

self.skipWaiting();

}

});

/* ==========================================
NOTIFICATIONS PUSH
========================================== */

self.addEventListener(
"push",
event => {

const options = {

body:
event.data
? event.data.text()
: "Nouvelle alerte Job Finder Vaud",

icon:
"/assets/icon-192.png",

badge:
"/assets/icon-192.png"

};

event.waitUntil(

self.registration.showNotification(

"Job Finder Vaud",

options

)

);

});

/* ==========================================
CLIC NOTIFICATION
========================================== */

self.addEventListener(
"notificationclick",
event => {

event.notification.close();

event.waitUntil(

clients.openWindow(
"/"
)

);

});

/* ==========================================
FIN SERVICE-WORKER.JS
========================================== */
