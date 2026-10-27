# FinanLocal

Aplicativo móvel para controle pessoal de despesas. Registre cada gasto com descrição, valor, categoria e data; fotografe o comprovante com a câmera do aparelho; capture a localização GPS quando disponível; e consulte ou exclua registros no histórico.

Os registros são guardados no AsyncStorage e as fotos são copiadas para a pasta persistente `document/receipts` do aplicativo. Os dados permanecem no aparelho e não exigem conta ou serviço remoto.

## Funcionalidades

- Cadastro de despesas com descrição, valor, categoria e data.
- Foto real do comprovante com solicitação de permissão da câmera.
- Registro opcional das coordenadas atuais obtidas pelo GPS, com solicitação de permissão e mensagens para casos de falha.
- Histórico com total acumulado, detalhes, coordenadas e visualização do comprovante.
- Exclusão da despesa e do arquivo de imagem associado.
- Persistência local sem login, banco de dados remoto ou dados fictícios.

## Tecnologias

- React Native e TypeScript.
- Expo SDK 57.
- AsyncStorage para os registros.
- `expo-camera` para fotografar comprovantes.
- `expo-location` para obter a localização atual.
- `expo-file-system` para guardar fotos no diretório persistente do aplicativo.

## Instalação

Requer Node.js e npm. Na pasta do projeto, instale as dependências do lockfile:

```bash
npm ci
```

## Execução

Inicie o Expo:

```bash
npm start
```

Use o QR code no aplicativo Expo Go em um dispositivo físico ou inicie um emulador Android/iOS pelo terminal:

```bash
npm run android
npm run ios
```

Ao usar câmera ou localização pela primeira vez, permita o acesso quando o sistema solicitar. O GPS depende dos serviços de localização do aparelho; se estiver desligado ou indisponível, a tela informa o problema e ainda permite salvar a despesa sem coordenadas. O cadastro exige uma foto feita pela câmera.

## Verificação

Execute a checagem de tipos:

```bash
npm run typecheck
```

Para validar câmera, GPS e persistência de arquivos, teste em um dispositivo físico ou emulador com suporte a esses recursos. Depois de salvar uma despesa, feche e reabra o aplicativo para confirmar o histórico; abra o comprovante pelo histórico e teste a exclusão.
