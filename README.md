# HomeHero

Webbapp som styr volym, ljus och låtbyte genom att luta och skaka telefonen. Musiken spelas i webbläsaren och ljuset är simulerat.

Statisk webbapp: [index.html](index.html) och [ha.js](ha.js).

## Home Assistant

Tryck på **Home Assistant** på startskärmen och fyll i:

- Adress till Home Assistant.
- Long-Lived Access Token (skapas under din användarprofil i Home Assistant).
- Ljus (`light.…`): styrs av lutning framåt/bakåt.
- Mediaspelare (`media_player.…`): volym styrs av lutning åt sidan, skaka byter låt.

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
3. Placera markören på en pil och tryck på **Skaka** eller mellanslag för att byta låt.

Testa gyro på en telefon:

1. Anslut telefonen till samma nätverk som datorn.
2. Gyro kräver HTTPS. Starta en tunnel, till exempel `caddy reverse-proxy --from <värdnamn> --to localhost:8080`, eller använd Chrome DevTools sensor-emulering (Sensors).
3. Öppna adressen på telefonen och tryck på **Starta**.
