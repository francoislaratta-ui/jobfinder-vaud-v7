const CACHE_NAME = "jobfinder-vaud-v11";

const urlsToCache = [

"/",
"/index.html",
"/manifest.json",
"/offers",
"/icon-192.png",
"/icon-512.png"

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

self.skipWaiting();

}
);

self.addEventListener(
"activate",
event => {

event.waitUntil(

caches.keys()

.then(names => {

return Promise.all(

names.map(name => {

if(
name !== CACHE_NAME
){

return caches.delete(
name
);

}

})

);

})

);

self.clients.claim();

}
);

self.addEventListener(
"fetch",
event => {

if(
event.request.method !== "GET"
){
return;
}

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

const clone =
networkResponse.clone();

caches.open(
CACHE_NAME
)

.then(cache => {

cache.put(
event.request,
clone
);

});

return networkResponse;

})

.catch(() => {

return caches.match(
"/index.html"
);

});

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
event.data.type === "SKIP_WAITING"
){

self.skipWaiting();

}

}
);
