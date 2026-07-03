Session 02.07.2026

scraper-local.js — 2 changements :



scrapeListPage : remplacement du regex href par extraction UUID depuis \_\_INIT\_\_ → capture les vraies URLs Jobup

scrapeDetailPage : suppression du double filtre vaudWords → region=52 dans l'URL suffit à garantir Vaud



app.js — 2 changements :



Filtre taux pour offres sans rate : cherche % dans le titre au lieu de "temps partiel" dans la description

Filtre métiers : ajout de \&\& selectedMetiers.length < totalMetiers → le filtre ne s'applique plus quand tous les métiers sont cochés

