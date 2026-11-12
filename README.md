# Lustiga Huset

Webbapp som styr volym, ljus och låtbyte genom att luta telefonen. Musiken spelas i webbläsaren och ljuset är simulerat tills du kopplar in Home Assistant eller Philips Hue.

Statisk webbapp: [index.html](index.html), [ha.js](ha.js), [hue.js](hue.js), [spotify.js](spotify.js), [weather.js](weather.js) och [manifest.webmanifest](manifest.webmanifest).

## Köra lokalt

Kräver [Caddy](https://caddyserver.com/).

1. Öppna en terminal i projektmappen.
2. Kör `caddy run`.
3. Öppna http://localhost:8080 i webbläsaren. Använd http://127.0.0.1:8080 om du ska koppla Spotify.
4. Stoppa servern med `Ctrl+C`.

## Styrning

- Den gröna pucken följer telefonens lutning över hela skärmen.
- Åt sidan styr volymen och framåt/bakåt styr ljuset. Ljuset visas som en vit cirkel som växer ut från pucken; helt mörkt är skärmen svart.
- Kör pucken in i en blå knapp för att byta låt. Knappen flyttas till en ny slumpad plats och puckens färg glider i spektrumet.
- Med Philips Hue kopplat finns en gul lampknapp per lampa. Kör pucken in i en lampknapp för att välja vilken lampa som styrs. Den valda lampan lyser starkare.
- Kör in i den svarta bomben för en slumpad låt: BOOM! Med Home Assistant hoppar den i stället fram 1–4 låtar.
- Kör in i den orange väderknappen för att se vädret där du är: låttexten tonar ut och en stor väderikon med beskrivning och temperatur visas en stund i stället. Sedan dyker knappen upp på ett nytt ställe. Platsen avrundas till ungefär 1 km och skickas till [Open-Meteo](https://open-meteo.com/) (gratis, ingen nyckel).
- Låttiteln skrivs ut stort i bakgrunden.
- Dubbeltryck på skärmen för att kalibrera om.
- Skaka telefonen för att komma tillbaka till startskärmen. Rummet blir rött och säger HEJ DÅ!
- Lägg till sidan på hemskärmen för helskärm. Skärmen hålls tänd medan appen används.

## Home Assistant

Styr ljus och mediaspelare. Mediaspelaren ersätter ljudet i webbläsaren.

### 1. Skapa en token

1. Öppna Home Assistant och klicka på ditt namn nere till vänster (din profil).
2. Välj fliken **Säkerhet**.
3. Gå till **Långlivade åtkomsttokens** och välj **Skapa token**.
4. Kopiera token. Den visas bara en gång.

### 2. Hitta entity-id

1. Gå till **Inställningar → Enheter och tjänster → Entiteter**.
2. Sök efter lampan eller spelaren.
3. Kopiera kolumnen **Entitets-ID**, till exempel `light.vardagsrum` eller `media_player.vardagsrum`.

### 3. Tillåt appens adress

Lägg till adressen som du öppnar appen från i `configuration.yaml`. Starta sedan om Home Assistant.

```yaml
http:
  cors_allowed_origins:
    - http://localhost:8080
```

- Adressen måste stämma exakt, inklusive `http://` eller `https://` och portnummer.
- Använd en rad per adress, till exempel en för datorn och en för telefonen.
- Körs appen över HTTPS måste Home Assistant också nås över HTTPS.

### 4. Fyll i appen

1. Tryck på **Home Assistant** på startskärmen.
2. Fyll i adress, till exempel `http://homeassistant.local:8123`. Använd IP-adressen om namnet inte fungerar.
3. Klistra in token.
4. Fyll i `light.…` för ljus och `media_player.…` för volym och låtbyte. Fälten är valfria.
5. Tryck på **Spara**.

Inställningarna sparas i webbläsaren på enheten. **Rensa** tar bort dem.

## Spotify

Spelar dina **Gillade låtar** på en Spotify-enhet, till exempel en högtalare. Kräver Spotify Premium. Spotify har företräde framför Home Assistant och ljudet i webbläsaren. Volym och låtbyte styr enheten.

### 1. Öppna appen på rätt adress

Spotify tillåter inte `http://localhost`. Öppna appen på `http://127.0.0.1:8080` eller över HTTPS.

### 2. Skapa en app hos Spotify

1. Gå till https://developer.spotify.com/dashboard och logga in.
2. Välj **Create app**.
3. Fyll i ett namn och en beskrivning.
4. Skriv adressen som visas i appens Spotify-ruta som **Redirect URI**, till exempel `http://127.0.0.1:8080/`. Adressen måste stämma exakt.
5. Välj **Web API** under "Which API/SDKs are you planning to use?" och spara.
6. Öppna appens **Settings** och kopiera **Client ID**.

### 3. Koppla i appen

1. Tryck på **Spotify** på startskärmen.
2. Klistra in Client ID.
3. Tryck på **Logga in på Spotify** och godkänn. Du kommer tillbaka till appen.
4. Starta Spotify på enheten som ska spela, och tryck på **Uppdatera listan** om enheten saknas.
5. Välj enhet och tryck på **Spara**.

Välj **Den här webbläsaren** som enhet för att spela musiken i webbläsaren, till exempel på telefonen. Då används Spotifys Web Playback SDK. Spotify stöder det inte officiellt i mobila webbläsare. Logga in på nytt efter uppdateringen, eftersom inloggningen behöver fler behörigheter. Inloggningen gäller per enhet och adress: på telefonen behöver du logga in där, och telefonens https-adress måste vara registrerad som Redirect URI hos Spotify.

Tryck på **Starta**. Appen spelar ett slumpat urval av dina Gillade låtar. Skaka telefonen för att pausa.

Inställningarna och inloggningen sparas i webbläsaren på enheten. **Rensa** tar bort dem.

## Philips Hue

Styr ljuset direkt mot Hue Bridge. Volym och låtbyte hanteras av webbläsaren eller Home Assistant. Hue har företräde framför Home Assistant för ljus.

### 1. Hitta bryggans IP-adress

- Öppna Hue-appen och gå till **Inställningar → Bridges**, tryck på bryggan och sedan på **i**.
- Eller leta efter bryggan i routerns lista över enheter.

Enheten som kör appen måste vara på samma nätverk som bryggan.

### 2. Godkänn certifikatet

Bryggan har ett självsignerat certifikat. Webbläsaren blockerar anrop tills du godkänt det.

1. Öppna `https://<bridge-ip>` i webbläsaren som kör appen.
2. Välj **Avancerat** och sedan **Fortsätt till …**.
3. Upprepa på varje enhet och webbläsare som ska styra ljuset.

### 3. Koppla

1. Tryck på **Philips Hue** på startskärmen.
2. Fyll i bridge-adressen.
3. Tryck på länkknappen på bryggan.
4. Tryck på **Koppla** inom 30 sekunder. Applikationsnyckeln fylls i.
5. Välj lampa i listan och tryck på **Spara**.

Felmeddelanden:

- **Kunde inte nå bryggan:** certifikatet är inte godkänt, eller adressen är fel.
- **link button not pressed:** tryck på länkknappen och försök igen.

Inställningarna sparas i webbläsaren på enheten. **Rensa** tar bort dem.

## Testa lokalt

Det finns inga automatiska tester. Testa manuellt:

1. Kör `caddy run` och öppna http://localhost:8080.
2. Tryck på **Starta**.
3. Styr pucken med piltangenterna. Volym och ljus ändras.
4. Styr pucken in i en blå knapp, eller klicka på knappen, för att byta låt. Tangenten C kalibrerar. Esc gör samma sak som att skaka.
5. Med Home Assistant eller Hue inkopplat: kontrollera att lampan och spelaren reagerar.

### Testa gyro på telefon

Gyro kräver HTTPS, utom på `localhost`.

1. Anslut telefonen till samma nätverk som datorn.
2. Starta en HTTPS-proxy: `caddy reverse-proxy --from https://<datorns-ip>:8443 --to localhost:8080`.
3. Öppna `https://<datorns-ip>:8443` på telefonen och godkänn certifikatvarningen.
4. Tryck på **Starta** och tillåt rörelsesensorer när frågan visas.
5. På Android: tillåt **Rörelsesensorer** i webbplatsinställningarna om inga sensordata kommer fram.

Gyro går också att testa på datorn med Chrome DevTools: öppna **Sensors** och välj en orientering under **Orientation**.
