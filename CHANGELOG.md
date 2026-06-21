# CHANGELOG — Session du 19.06.2026

## Fichiers modifiés
- `app.js`
- `server.js`

---

## Corrections app.js

### normalizeText
- Nettoyage caractères invisibles Unicode (U+200B, U+FEFF, U+00A0) ajouté en premier

### loadOffers
- `title` et `company` nettoyés des caractères invisibles à l'arrivée

### Filtre taux (applyFilters)
- `return false` si pas de taux → `return true` (offres sans taux passent)
- Logique stricte : si taux unique → égalité exacte, si plage → taux coché dans la plage
- Filtre numéros 10-100 uniquement pour éviter faux positifs

### Offres expirées
- Masquage automatique des offres dont `applyBefore` est dépassé

### SCRAPE_KEYWORDS
- Synchronisés avec SEARCH_KEYWORDS Jobup (8 keywords)
- Logique : expression complète OU tous les mots significatifs présents

### formatAddress
- Filtre renforcé : mots parasites normalisés avant test
- Lignes > 60 chars ignorées
- Mots parasites : qualit, ressources, humaines, service, direction, terminee, determin, propose, prepose, francais, deutsch, jobcloud

### formatDate
- Format forcé jj.mm.aaaa partout
- Date de publication also passée par formatDate

### looksLikeWantedJob (app.js SCRAPE_KEYWORDS)
- Matching strict : tous les mots doivent être présents (plus de mot isolé)

### Profil IA (userProfile)
- targetJobs élargi : Gestionnaire, Collaborateur, Administratif, Secrétaire, Coordinateur, Conseiller, Chargé de
- preferredSectors élargi : Public, Commune, Canton, Finance, Comptabilité, Logistique, RH
- Taux : si vide → ne pénalise plus le score

### analyzeExtractedText (keywords CV)
- Logiciels ajoutés : Office 365, Filemaker Pro, Pro-concept, Hypsis, Axapta, Timeas, Tipee, Linux, Unix
- Admin ajoutés : accueil, réception, secrétariat, bureautique, agenda, contentieux, budget, admission, planning
- Support IT ajoutés : parc informatique, configuration, formation utilisateurs
- Allemand retiré des langues (connaissances scolaires)
- Filtre qualificatifs faibles : scolaire, notions, debutant, bases → langue ignorée

### Matching CV ↔ offre
- Matching souple : mot partiel accepté si > 4 chars

---

## Corrections server.js

### Extraction Jobup (extract-description)
- Labels collés séparés : Taux d'activité, Type de contrat, Classe salariale, etc.
- Classe salariale extraite directement du bon label
- Dates formatées jj.mm.aaaa
- Adresse : liste noire mots parasites élargie

### Extraction générique (toutes sources)
- Taux : label structuré en priorité (Taux d'occupation), puis générique 10-100%
- Contrat : label structuré (Durée d'emploi), "contrat à durée indéterminée" → CDI
- Salaire : CHF .../an ou /mois
- Date d'entrée : labels élargis, validation contenu
- Classe salariale : ajoutée, regex stricte codes courts
- Adresse : rue + NPA + ville sur 2 lignes, NPA Suisse 1000-9699, années 2020-2030 exclues
- salaryGrade ajouté dans res.json

### Indeed
- Remplacé scraping HTML par RSS public (8 queries = SEARCH_KEYWORDS Jobup)
- Filtre looksLikeWantedJob retiré (queries déjà ciblées)
- Date formatée jj.mm.aaaa depuis pubDate RSS

### LinkedIn
- Remplacé scraping HTML par API guest /jobs-guest/jobs/api/
- 8 queries = SEARCH_KEYWORDS Jobup
- Extraction titre, company, location, date, taux, contrat

### looksLikeWantedJob
- Basé exactement sur SEARCH_KEYWORDS Jobup
- Phrases exactes en priorité, puis combinaisons de mots
- "technicien" seul supprimé → doit être avec "informatique" ou "support"

### Migros / Nestlé / Coop
- Passés sur fetchKeywordOffers (même logique que Jobup)
- Cherche par SEARCH_KEYWORDS, filtre looksLikeWantedJob
- Extrait taux et contrat depuis titre

### La Poste
- Nouvelle source ajoutée (career.post.ch)
- Même logique fetchKeywordOffers

---

## État actuel
- Sources actives : Jobup, État de Vaud, Indeed (RSS), LinkedIn (API guest), Migros, Nestlé, Coop, La Poste
- Keywords de référence : SEARCH_KEYWORDS Jobup (8 termes)
- Toutes sources synchronisées sur ces mêmes keywords
- Prochains bugs à corriger : tester LinkedIn/Indeed en prod, vérifier Migros/Coop/Poste URLs

