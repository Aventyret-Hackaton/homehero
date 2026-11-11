# HomeHero

Webbapp som styr volym, ljus och låtbyte genom att luta och skaka telefonen. Musiken spelas i webbläsaren och ljuset är simulerat.

Projektet är en enda statisk fil: [index.html](index.html).

## Köra lokalt

Kräver [Caddy](https://caddyserver.com/).

```sh
caddy run
```

Öppna http://localhost:8080.

## Testa lokalt

Det finns inga automatiska tester. Testa manuellt i webbläsaren:

1. Klicka på **Starta**.
2. Dra i rutan för att styra volym (vänster–höger) och ljus (upp–ner).
3. Placera markören på en pil och tryck på **Skaka** eller mellanslag för att byta låt.

Testa gyro på en telefon:

1. Anslut telefonen till samma nätverk som datorn.
2. Gyro kräver HTTPS. Starta en tunnel, till exempel `caddy reverse-proxy --from <värdnamn> --to localhost:8080`, eller använd Chrome DevTools sensor-emulering (Sensors).
3. Öppna adressen på telefonen och tryck på **Starta**.
