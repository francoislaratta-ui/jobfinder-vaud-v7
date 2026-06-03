const CACHE_NAME =
"jobfinder-vaud-v13";

const urlsToCache = [

"/",
"/index.html",
"/offers.json",
"/manifest.json"

];

self.addEventListener(

"install",

event=>{

event.waitUntil(

caches.open(
CACHE_NAME
)

.then(cache=>{

return cache.addAll(
urlsToCache
);

})

);

}

);

self.addEventListener(

"fetch",

event=>{

event.respondWith(

caches.match(
event.request
)

.then(response=>{

return (
response ||
fetch(
event.request
)
);

})

);

}

);

self.addEventListener(

"activate",

event=>{

event.waitUntil(

caches.keys()

.then(keys=>{

return Promise.all(

keys.map(key=>{

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
