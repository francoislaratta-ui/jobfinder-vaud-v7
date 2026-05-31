const CACHE_NAME = "jobfinder-vaud-v86";

const urlsToCache = [

"/",
"/index.html",
"/offers.json",
"/manifest.json"

];

self.addEventListener(

"install",

event => {

event.waitUntil(

caches.open(
CACHE_NAME
)

.then(cache => {

return cache.addAll(
urlsToCache
);

})

);

}

);

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

}

);

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
);

})

);

}

);

self.addEventListener(

"message",

event => {

if(
event.data
&&
event.data.type ===
"SKIP_WAITING"
){

self.skipWaiting();

}

}

);

self.addEventListener(

"push",

event => {

const options = {

body:
event.data
? event.data.text()
: "Nouvelle offre disponible",

icon:
"/icon-192.png",

badge:
"/icon-192.png"

};

event.waitUntil(

self.registration
.showNotification(

"🔔 Job Finder Vaud",

options

)

);

}

);
