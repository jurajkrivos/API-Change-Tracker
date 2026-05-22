# API Change Tracker

## English Guide

### Description
API Change Tracker monitors changes in OpenAPI JSON specifications. It allows you to add an OpenAPI URL, periodically verify the API definition, and track changes, errors, and check history.

### Requirements
- Python 3.11+ (or compatible)
- `pip`
- Internet access to fetch OpenAPI JSON files

### Installation
Open a terminal in the project folder and install dependencies:

```bash
pip install -r requirements.txt
```

### Run the app
Start the Flask application with:

```bash
python app.py
```

Then open your browser at:

```
http://127.0.0.1:5000/
```

### Usage
1. In the `Global check` section, set the check interval.
2. Click `Advanced settings` to choose the app language (Slovak or English).
3. In `Add tracked endpoint`, enter the API name and OpenAPI JSON URL.
4. After adding the endpoint, the first check runs automatically.
5. In the tracked API list, you can:
   - view details and logs by clicking the API name
   - run a manual check
   - delete the endpoint

### Language settings
The app supports Slovak and English, with Slovak set as the default interface language. Change language in `Advanced settings` inside the `Global check` section.

### Database
The app uses an SQLite database file named `endpoints.db` in the project root. It stores:
- tracked endpoints
- the latest JSON snapshot
- change records
- check logs
- global settings

### API endpoints
These internal API endpoints support the frontend and manual usage:
- `GET /api/settings` — get interval and language settings
- `POST /api/settings` — save interval and language
- `GET /api/endpoints` — get the list of endpoints
- `POST /api/endpoints` — add a new endpoint
- `DELETE /api/endpoints/<id>` — delete an endpoint
- `POST /api/check/<id>` — manually run a check for an endpoint
- `GET /api/changes/<id>` — list changes for an endpoint
- `GET /api/logs/<id>` — list check logs for an endpoint

### Notes
- To change the host or port, edit the run configuration in `app.py`.
- The first run creates the database and default settings automatically.

---

## Slovenská príručka

### Popis
Aplikácia sleduje zmeny v OpenAPI JSON špecifikáciách. Umožňuje pridať URL OpenAPI definície, pravidelne kontrolovať ich stav a evidovať zmeny, chyby a históriu kontrol.

### Požiadavky
- Python 3.11+ (alebo kompatibilná verzia)
- `pip`
- Internetové pripojenie pre získavanie OpenAPI JSON súborov

### Inštalácia
1. Otvorte terminál v priečinku projektu.
2. Nainštalujte závislosti:

```bash
pip install -r requirements.txt
```

### Spustenie
Spustite Flask aplikáciu pomocou:

```bash
python app.py
```

Potom otvorte prehliadač a choďte na:

```
http://127.0.0.1:5000/
```

### Použitie aplikácie
1. V sekcii `Globálna kontrola` nastavte interval kontroly.
2. Kliknite na `Rozšírené nastavenia`, ak chcete zmeniť jazyk aplikácie (slovenčina / angličtina).
3. V sekcii `Pridať sledovaný endpoint` vložte názov API a URL OpenAPI JSON.
4. Po pridaní sa endpoint uloží a spustí sa prvá kontrola.
5. V zozname sledovaných API môžete:
   - zobraziť detaily a logy kliknutím na názov
   - spustiť manuálnu kontrolu
   - zmazať endpoint

### Nastavenia jazyka
Aplikácia podporuje slovenský a anglický jazyk, pričom predvolený je slovenský. Jazyk nastavíte v rozšírených nastaveniach v sekcii `Globálna kontrola`.

### Databáza
Aplikácia používa SQLite databázu `endpoints.db` v koreňovom priečinku projektu. V databáze sa ukladajú:
- sledované endpoints
- posledný snapshot JSON
- zmeny
- logy kontrol
- globálne nastavenia

### API koncové body
Aplikácia poskytuje interné API pre frontend aj pre manuálne použitie:
- `GET /api/settings` — získa nastavenia intervalu a jazyka
- `POST /api/settings` — uloží interval a jazyk
- `GET /api/endpoints` — zoznam endpoints
- `POST /api/endpoints` — pridanie nového endpointu
- `DELETE /api/endpoints/<id>` — odstránenie endpointu
- `POST /api/check/<id>` — manuálna kontrola endpointu
- `GET /api/changes/<id>` — zoznam zmien endpointu
- `GET /api/logs/<id>` — logy kontrol endpointu

### Poznámky
- Ak chcete aplikáciu presunúť na iný port alebo hostiteľa, upravte spustenie v `app.py`.
- Prvé spustenie vytvorí databázu a predvolené nastavenia automaticky.
