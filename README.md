# 🧠 DorratCache

**DorratCache** es una caché adaptable en memoria con soporte para estrategias de eliminación (`LRU`, `LFU`), TTL dinámico, persistencia opcional y compatibilidad total con **CommonJS** y **ESM**.

> 🚀 Ideal para bots, middleware, rate-limiters, sesiones y cualquier otro uso que necesite una caché inteligente, flexible y veloz.

---

## 📦 Requisitos

- Node.js **v18 o superior**
- Acceso a `fs/promises` y `path` (vienen con Node)

---

## ✨ Características

- ✅ TTL (tiempo de vida) por clave
- ♻️ Adaptación automática del TTL según frecuencia de uso
- 🧠 Estrategia de eliminación:
  - `LRU`: Least Recently Used (por defecto)
  - `LFU`: Least Frequently Used
- 💾 Persistencia opcional en disco (`JSON`)
- 🔧 Compatible con `ESM` y `CommonJS`
- 🔥 Sistema de eventos (`set`, `hit`, `del`, `clear`, `evict`)
- 🛠️ Tipado completo en TypeScript (`.d.ts` incluido)

---

## 🔰 Uso Básico (ESM)

```js
// ESM
import DorratCache from 'dorrat-cache';

const cache = new DorratCache({
  max: 100,
  ttl: 60000, // 60s por defecto
  strategy: 'lru',
  adaptive: true,
  persistence: './cache.json'
});

cache.set('clave', 'valor');
console.log(cache.get('clave')); // "valor"
```

---

## 🔰 Uso Básico (CommonJS)

```js
// CommonJS
const { DorratCache } = require('dorrat-cache');

const cache = new DorratCache({
  max: 100,
  ttl: 60000,
  strategy: 'lfu',
  adaptive: true,
  persistence: './cache.json'
});

cache.set('clave', 'valor');
console.log(cache.get('clave')); // "valor"
```

---

## 🧪 API Pública

### `new DorratCache(options)`

| Opción        | Tipo              | Default      | Descripción                             |
|--------------|-------------------|--------------|-----------------------------------------|
| `max`        | `number`          | `256`        | Máximo de entradas almacenadas          |
| `ttl`        | `number` (ms)     | `60000`      | Tiempo de vida por defecto por clave    |
| `strategy`   | `'lru'` / `'lfu'` | `'lru'`      | Estrategia de eliminación               |
| `adaptive`   | `boolean`         | `true`       | Aumenta TTL según frecuencia de acceso  |
| `persistence`| `boolean|string`  | `false`      | Guarda y restaura caché desde disco     |

---

### Métodos

| Método               | Descripción                                             |
|----------------------|---------------------------------------------------------|
| `set(key, val, ttl?)`| Guarda un valor con TTL opcional                        |
| `get(key, def?)`     | Obtiene un valor, actualiza hits y TTL si aplica       |
| `has(key)`           | Retorna `true` si la clave existe y no ha expirado     |
| `ttl(key)`           | Retorna el tiempo restante en ms o `-1` si no existe   |
| `delete(key)`        | Elimina una entrada manualmente                        |
| `clear()`            | Limpia toda la caché                                    |
| `size()`             | Retorna la cantidad de claves actuales                 |
| `keys()`             | Lista de claves actuales                               |
| `values()`           | Lista de valores actuales                              |
| `entries()`          | Lista de pares `[clave, valor]`                        |
| `snapshot()`         | Dump actual (serializable) de todo el contenido        |
| `[Symbol.iterator]`  | Iterador para usar en `for...of`                       |

---

## 📡 Eventos

Puedes usar `.on()` para reaccionar a eventos:

```js
cache.on('set', (key, val) => {
  console.log(`📝 Seteado: ${key} =`, val);
});

cache.on('hit', (key, val) => {
  console.log(`🎯 Cache hit: ${key}`);
});

cache.on('del', key => {
  console.log(`🗑️ Eliminado: ${key}`);
});

cache.on('evict', key => {
  console.log(`🚮 Evictado: ${key}`);
});
```

---

## 📚 Ejemplo con TTL adaptativo y persistencia

```js
const cache = new DorratCache({
  ttl: 30000,
  adaptive: true,
  persistence: './session-cache.json'
});

cache.set('user123', { online: true });

// Simula acceso frecuente:
setInterval(() => {
  cache.get('user123');
  console.log('TTL:', cache.ttl('user123'));
}, 5000);
```

---

## 🗂 Estructura del Proyecto

```
📁 dorrat-cache
├── esm/
│   └── index.js       → Versión ESM
├── cjs/
│   └── index.cjs      → Versión CommonJS
├── types/
│   └── index.d.ts     → Tipado TypeScript
└── package.json       → Metadata del paquete
```

---

## 🧠 Pensado para...

- **Bots** (WhatsApp, Discord, Telegram)
- **APIs y middleware**
- **Rate-limiting / anti-spam**
- **Sistemas temporales / TTL**
- **Caches interactivas con persistencia**

---

## 📜 Licencia

MIT — Hecho con 💖 por [DIEGO-OFC](https://github.com/DIEGO-OFC)

---

## 📦 Instalar (solo como referencia)

> ⚠️ Ya que no se pidió instalación, omite este bloque si no deseas incluirlo:
```bash
npm install dorrat-cache
```
---

## 💡 Tip

Puedes acceder a la caché como un iterable:

```js
for (const [key, value] of cache) {
  console.log(key, value);
}
```

---

**DorratCache**: Simple y rápido.
