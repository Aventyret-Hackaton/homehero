# Dumb Home

Webbapp som styr volym, ljus och låtbyte genom att luta telefonen. Musiken spelas i webbläsaren och ljuset är simulerat.

Statisk webbapp: [index.html](index.html), [ha.js](ha.js) och [manifest.webmanifest](manifest.webmanifest).

## Styrning

- Den gröna pucken följer telefonens lutning över hela skärmen.
- Åt sidan styr volymen och framåt/bakåt styr ljuset. Ljuset visas som en vit cirkel som växer ut från pucken; helt mörkt är skärmen svart.
- Kör pucken in i en blå knapp för att byta låt. Knappen flyttas till en ny slumpad plats och puckens färg glider i spektrumet.
- Låttiteln skrivs ut stort i bakgrunden.
- Dubbeltryck på skärmen för att kalibrera om.
- Skaka telefonen för att komma tillbaka till startskärmen. Rummet blir rött och ber dig sluta.
- Lägg till sidan på hemskärmen för helskärm. Skärmen hålls tänd medan appen används.

## Home Assistant

Tryck på **Home Assistant** på startskärmen och fyll i:

- Adress till Home Assistant.
- Long-Lived Access Token (skapas under din användarprofil i Home Assistant).
- Ljus (`light.…`): styrs av lutning framåt/bakåt.
- Mediaspelare (`media_player.…`): volym styrs av lutning åt sidan, de blå knapparna byter låt.

Inställningarna sparas i webbläsaren på enheten. Utan mediaspelare spelas ljud i webbläsaren.

Home Assistant måste tillåta appens adress i `configuration.yaml`:

```yaml
http:
  cors_allowed_origins:
    - http://localhost:8080
```

Om appen körs över HTTPS måste Home Assistant också nås över HTTPS.

## Köra lokalt

Kräver [Caddy](https://caddyserver.com/).

```sh
caddy run
```

Öppna http://localhost:8080.

## Testa lokalt

Det finns inga automatiska tester. Testa manuellt i webbläsaren:

1. Klicka på **Starta**.
2. Använd piltangenterna för att styra volym (vänster–höger) och ljus (upp–ner).
3. Styr pucken in i en blå knapp, eller klicka på knappen, för att byta låt. Tangenten C kalibrerar. Esc gör samma sak som att skaka.

Testa gyro på en telefon:

1. Anslut telefonen till samma nätverk som datorn.
2. Gyro kräver HTTPS. Starta en tunnel, till exempel `caddy reverse-proxy --from <värdnamn> --to localhost:8080`, eller använd Chrome DevTools sensor-emulering (Sensors).
3. Öppna adressen på telefonen och tryck på **Starta**.
