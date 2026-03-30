# DeFi Bank — Exercice dApp

Application décentralisée (dApp) permettant de déposer et retirer des ETH depuis un smart contract Ethereum.

![Aperçu de l'application](frontend/public/ui.png)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styles | Tailwind CSS v4 + shadcn/ui |
| Blockchain | Wagmi v3 + Viem v2 |
| Wallet | Reown AppKit |
| Backend | Hardhat v3 (Solidity 0.8.28) |

---

## Structure du projet

```
.
├── backend/                    # Smart contract Hardhat
│   ├── contracts/
│   │   └── Bank.sol            # Contrat principal
│   ├── ignition/               # Scripts de déploiement
│   ├── test/                   # Tests du contrat
│   └── hardhat.config.ts
└── frontend/                   # Application Next.js
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   └── page.tsx
        ├── components/shared/
        │   ├── Balance.tsx      # ⬅ À compléter
        │   ├── Bank.tsx         # ⬅ À compléter
        │   ├── Deposit.tsx      # ⬅ À compléter
        │   ├── Events.tsx       # ⬅ À compléter
        │   ├── Withdraw.tsx     # ⬅ À compléter
        │   ├── ConnectButton.tsx
        │   ├── Header.tsx
        │   ├── Footer.tsx
        │   ├── Layout.tsx
        │   └── NotConnected.tsx
        ├── config/index.tsx     # Adresse + ABI du contrat, config Wagmi
        ├── context/index.tsx    # Providers React (Wagmi + QueryClient)
        ├── lib/client.ts        # publicClient Viem (Hardhat local)
        └── types/bank.ts        # Type BankEvent
```

---

## Smart contract — `Bank.sol`

### Fonctions

| Fonction | Description |
|---|---|
| `deposit()` | Dépose des ETH (`payable`) |
| `withdraw(uint256 _amount)` | Retire `_amount` wei |
| `getBalanceOfUser(address _user)` | Retourne le solde d'un utilisateur |
| `getLastDepositTimestamp(address _user)` | Retourne le timestamp du dernier dépôt |

### Événements

| Événement | Paramètres |
|---|---|
| `etherDeposited` | `address indexed account`, `uint256 amount` |
| `etherWithdrawn` | `address indexed account`, `uint256 amount` |

### Erreurs custom

- `CannotBeZero()` — montant nul interdit
- `NotEnoughFunds()` — solde insuffisant
- `TransferFailed()` — échec du transfert ETH

---

## Installation et démarrage

### Prérequis

- Node.js >= 18
- npm ou yarn
- MetaMask (ou tout wallet compatible WalletConnect)

### 1. Démarrer le nœud Hardhat local

```bash
cd backend
npm install
npx hardhat node
```

### 2. Déployer le contrat

Dans un second terminal :

```bash
cd backend
npx hardhat ignition deploy ignition/modules/Bank.ts --network localhost
```

L'adresse de déploiement par défaut est `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### 3. Configurer le frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Renseignez votre `NEXT_PUBLIC_PROJECT_ID` obtenu sur [dashboard.reown.com](https://dashboard.reown.com).

### 4. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

---

## Exercice — Bouts de code à compléter

Tous les fichiers à compléter sont dans `frontend/src/components/shared/`. Les zones à implémenter sont marquées par :

```tsx
{/*********** à compléter ***********/}
```

| Fichier | Zones à compléter |
|---|---|
| `Balance.tsx` | Affichage du solde (1 zone) |
| `Bank.tsx` | `useReadContract`, corps de `getEvents`, `useEffect` (3 zones) |
| `Deposit.tsx` | Paramètres de `writeContract`, corps du `useEffect` (2 zones) |
| `Withdraw.tsx` | Appel `writeContract`, corps du `useEffect` (2 zones) |
| `Events.tsx` | Rendu de chaque événement dans le `.map` (1 zone) |

---

## Fonctionnalités attendues

- Connexion wallet via Reown AppKit (bouton en haut à droite)
- Affichage du solde ETH en temps réel après connexion
- Formulaire de dépôt avec feedback de statut (soumis → confirmation → confirmé / erreur)
- Formulaire de retrait avec même feedback
- Historique des transactions récupéré depuis les événements on-chain, trié du plus récent au plus ancien