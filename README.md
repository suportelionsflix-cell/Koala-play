# KOALA PLAYER para Android

A interface é o `index.html` do app web (em `app/src/main/assets`). A reprodução de vídeo é nativa:
- **ExoPlayer** (AndroidX Media3 1.4.1): HLS (M3U8), MPEG-TS e arquivos de filmes.
- **VLC** (LibVLC 3.6.0): dentro do próprio app.

## Como gerar o APK
1. Instale o Android Studio e abra a pasta `koala-player-android`.
2. Espere a sincronização do Gradle terminar (precisa de internet na primeira vez).
3. Celular ou TV com depuração USB ligada: botão Run. Para um APK: Build > Build APK(s).

## Como funciona
- `MainActivity`: mostra a interface em um WebView e faz o papel do proxy (sem problema de CORS ou http).
- `PlayerActivity`: toca o vídeo com ExoPlayer ou LibVLC. O botão no topo troca de player mantendo o ponto atual.
- Configurações > Player de vídeo: ExoPlayer (Recomendado) ou VLC Player, separado para ao vivo e filmes/séries. A escolha fica salva.

## Se atualizar a interface
Copie o novo `index.html` por cima de `app/src/main/assets/index.html`.