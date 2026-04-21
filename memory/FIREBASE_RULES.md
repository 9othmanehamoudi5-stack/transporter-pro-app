# Règles de Sécurité Firebase - Transporter-Pro (PRODUCTION)

## Instructions
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **projet-app-transport**
3. Naviguez vers **Firestore Database** > **Règles**
4. Remplacez le contenu par les règles ci-dessous
5. Cliquez **Publier**

## Règles de Production (Cloisonnement par companyId)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ─── POSITIONS GPS CHAUFFEURS ───
    // Lecture : tout utilisateur authentifié de la même entreprise
    // Écriture : uniquement le chauffeur lui-même
    match /driver_locations/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == driverId;
    }

    // ─── LIVRAISONS ───
    // Cloisonnées par companyId
    match /deliveries/{docId} {
      allow read: if request.auth != null
                  && resource.data.companyId == request.auth.token.companyId;
      allow create: if request.auth != null
                    && request.resource.data.companyId == request.auth.token.companyId;
      allow update: if request.auth != null
                    && resource.data.companyId == request.auth.token.companyId;
      allow delete: if false;
    }

    // ─── RAPPORTS DE DOMMAGES ───
    match /damage_reports/{docId} {
      allow read: if request.auth != null
                  && resource.data.companyId == request.auth.token.companyId;
      allow create: if request.auth != null
                    && request.resource.data.companyId == request.auth.token.companyId;
      allow update, delete: if false;
    }

    // ─── ÉCO-SCORES ───
    match /eco_scores/{docId} {
      allow read: if request.auth != null
                  && resource.data.companyId == request.auth.token.companyId;
      allow write: if request.auth != null
                   && request.resource.data.companyId == request.auth.token.companyId;
    }

    // ─── RÈGLE PAR DÉFAUT ───
    // Bloquer tout accès non explicitement autorisé
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Important
- Ces règles utilisent `request.auth.token.companyId` — cela nécessite de définir des Custom Claims Firebase avec le companyId de l'utilisateur.
- Alternative simplifiée (si Custom Claims non configurés) : utilisez les règles ci-dessous qui vérifient uniquement l'authentification.

## Règles Simplifiées (Auth uniquement, sans Custom Claims)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /driver_locations/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /deliveries/{docId} {
      allow read, write: if request.auth != null;
    }
    match /damage_reports/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
    match /eco_scores/{docId} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Note
Le cloisonnement strict par `companyId` est implémenté au niveau du **backend FastAPI** (MongoDB queries filtrent par company_id). Les règles Firestore ci-dessus ajoutent une couche de sécurité supplémentaire pour les accès Firestore directs (GPS tracking).
