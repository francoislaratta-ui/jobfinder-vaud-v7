Session 23.06.2026 — V14.6 Premium IA

Filtres taux



extractNormalizedRate réécrite : priorité champ rate (pas le titre), multiples de 5 (5-100%), logique min-max

Filtre taux : selectAllTaux ignoré, valeurs numériques uniquement

Bulle et Romont supprimés de VAUD\_PLACES (canton Fribourg)



Scraping



fetchJobScout24Offers : fetch HTML de chaque annonce pour rate/contract/address

fetchIndeedOffers : recherche par keyword, URLs parasites bloquées, extractDetails: true

fetchLinkedInOffers : extractDetails: true pour extraire la vraie company

fetchFreshJobsOffers : nouvelle source RSS

fetchEmploisVaudOffers : nouvelle source HTML

fetchChuvOffers : scraper direct recrutement.chuv.ch

Migros, Nestlé, Coop supprimés (JS dynamique, peu fiables)

extractOfferDetails : extrait company/rate/contract depuis HTML offre (LinkedIn, Indeed)

fetchGenericJobPageOffers : titre nettoyé, blockedLinkPatterns supporté

Jobup : taux unique non fiable laissé vide (force extraction HTML)



Keywords



SEARCH\_KEYWORDS enrichi : secrétaire, secrétaire comptable, secrétaire d'unité, secrétaire administratif, assistant de direction

looksLikeWantedJob : exclusions ajoutées (commerce de détail, assistante médicale, assistant RH)

excludedKeywords Jobup : mêmes exclusions



Extraction générique



/api/extract-description : bloc générique pour toutes sources non-Jobup (rate, contract, address, salary, startDate, applyBefore)



Raisons IA



Raisons IA dynamiques dans les cartes offres (issues de calculateMatchDetails)

analyzeExtractedText : keywords étendus (office 365, filemaker, linux, pro-concept, secrétariat, contentieux, etc.)

userProfile : métiers, secteurs, taux, contrats enrichis pour coller au profil réel



Filtres sauvegarde



saveFilters() retiré de applyFilters() — sauvegarde uniquement au clic "Rechercher"

restoreSavedFilters() retiré de loadOffers() — évite l'écrasement des nouveaux critères

saveFilters() appelé en premier dans le bouton "Rechercher" avant tout chargement



Onglet IA Premium



Bloc "Meilleur Match du Jour" remplacé par "Recherche par compatibilité CV"

Bouton "Analyser la compatibilité" : trie toutes les offres par score IA, affiche top 10 avec médailles, cliquable vers l'offre



CV François Laratta



CV optimisé ATS pour poste Gestionnaire de dossiers (CV\_Laratta\_97pct.docx)

Mots-clés ATS intégrés : ERP, Excel, classement, archivage, saisie, relances débiteurs, gestion des flux

Rubriques SECRÉTARIAT (option C), INFORMATIQUE (option A), ADMINISTRATIF (option B) reformulées

