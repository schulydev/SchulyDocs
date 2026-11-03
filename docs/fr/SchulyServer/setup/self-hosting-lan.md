# Faire tourner Schuly sans domaine

Fais tourner Schuly sur ton réseau local pour le tester, par exemple avec un téléphone sur le même
Wi-Fi. Sans domaine, il n'y a pas de certificat, le trafic passe donc en HTTP non chiffré. Utilise
cette configuration uniquement pour des tests.

Suis [Auto-héberger Schuly](self-hosting.md) avec les changements ci-dessous. Les exemples utilisent
`192.168.1.42` comme adresse de ton ordinateur.

## 1. Définir l'adresse

Saute l'étape DNS. Dans `.env`, définis :

```sh
API_HOST=192.168.1.42
```

## 2. Servir en HTTP non chiffré

Remplace le contenu de `Caddyfile` :

```
http://{$API_HOST}:8080 {
	reverse_proxy backend:8080
}
```

Dans `compose.staging.yml`, remplace les `ports` du service `caddy` :

```yaml
    ports:
      - "8080:8080"
```

## 3. Corriger les liens des mails

Dans `config/backend.env`, définis :

```
Email__Smtp__PasswordResetLinkTemplate=http://${API_HOST}:8080/reset-password?token={token}
Email__Smtp__EmailVerificationLinkTemplate=http://${API_HOST}:8080/verify-email?token={token}
```

## 4. Démarrer et vérifier

```sh
docker compose -f compose.staging.yml up -d
curl http://192.168.1.42:8080/api/app/school-systems
```

Dans l'application, saisis `http://192.168.1.42:8080` comme **Backend URL**.

## Dépannage

**Le téléphone n'atteint pas le serveur.** Sous Windows, le pare-feu peut le bloquer. Autorise Docker
Desktop sur les réseaux privés, ou ajoute une règle entrante pour le port 8080.

**Une adresse `nip.io` ou `sslip.io` ne se résout pas.** Beaucoup de routeurs domestiques bloquent les
noms publics qui pointent vers des adresses privées. Utilise plutôt l'adresse IP.

**L'adresse ne fonctionne plus.** Ton routeur a peut-être attribué une nouvelle adresse IP. Mets à jour
`API_HOST` et redémarre, ou réserve l'adresse dans ton routeur.
