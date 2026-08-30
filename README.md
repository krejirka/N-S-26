# Výpravy · ironknot.cz

Portál cestovních plánů. Každá výprava je **samostatná aplikace** ve složce, která odpovídá cestě za lomítkem:

| URL | Složka | Přístup |
| --- | --- | --- |
| [vypravy.ironknot.cz/n-s-26](https://vypravy.ironknot.cz/n-s-26) | `n-s-26/` | privátní, heslo |
| [vypravy.ironknot.cz/s-b-sm-26](https://vypravy.ironknot.cz/s-b-sm-26) | `s-b-sm-26/` | veřejná |

Kompletní šablona pro novou cestu: **[vypravy-ironknot.md](./vypravy-ironknot.md)**.

```bash
npm install
npm run dev:n-s-26      # http://localhost:5173/n-s-26/
npm run dev:s-b-sm-26   # http://localhost:5173/s-b-sm-26/
npm run build           # obě aplikace + dist/ pro Vercel
```

Vercel: jeden projekt, root tohoto repozitáře, custom domain `vypravy.ironknot.cz`. Starý host `n-s-26.ironknot.cz` přesměruje na `/n-s-26`.
