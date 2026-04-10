# Règles de Sécurité Firebase - Transporter-Pro

## Instructions
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **projet-app-transport**
3. Naviguez vers **Firestore Database** > **Règles**
4. Remplacez le contenu par les règles ci-dessous
5. Cliquez **Publier**

## Règles à copier

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Entreprises (subscriptions)
    match /entreprises/{docId} {
      allow read, write: if true;
    }

    // Missions (deliveries)
    match /missions/{docId} {
      allow read, write: if true;
    }

    // Chauffeurs (drivers)
    match /chauffeurs/{docId} {
      allow read, write: if true;
    }
  }
}
```

## Note de sécurité
Ces règles sont **permissives** (allow read, write: if true) pour le développement.
Pour la production, vous devriez restreindre avec Firebase Authentication :

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /entreprises/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /missions/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /chauffeurs/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```
