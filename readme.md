# dorrat-cache

[![npm](https://img.shields.io/npm/v/dorrat-cache?logo=npm)](https://www.npmjs.com/package/dorrat-cache)
[![license](https://img.shields.io/npm/l/dorrat-cache)](LICENSE)
[![node](https://img.shields.io/node/v/dorrat-cache)](#requisitos)
[![types](https://img.shields.io/npm/types/dorrat-cache)](./types/index.d.ts)

> **dorrat-cache** es una caché en memoria ultraligera y *framework-agnostic* para Node.js (ESM y CommonJS) con TTL adaptativo, estrategias **LRU/LFU**, persistencia opcional en disco y tipado completo para TypeScript.

---

## Tabla de contenido

1. [Requisitos](#requisitos)  
2. [Instalación](#instalación)  
3. [Características clave](#características-clave)  
4. [Ejemplos rápidos](#ejemplos-rápidos)  
   4.1 [ESM](#esm)  
   4.2 [CommonJS](#commonjs)  
5. [API detallada](#api-detallada)  
   5.1 [Constructor y opciones](#constructor-y-opciones)  
   5.2 [Métodos](#métodos)  
   5.3 [Eventos](#eventos)  
6. [Persistencia a disco](#persistencia-a-disco)  
7. [Estrategias de expulsión](#estrategias-de-expulsión)  
8. [Iteración y utilidades](#iteración-y-utilidades)  
9. [TypeScript](#typescript)  
10. [Benchmarks](#benchmarks)  
11. [Migración desde v1](#migración-desde-v1)  
12. [Contribuir](#contribuir)  
13. [Licencia](#licencia)  

---

## Requisitos

* Node.js **≥ 18**  
* Compatible con Linux, macOS y Windows.

---

## Instalación

```bash
# npm
npm i dorrat-cache

# pnpm
pnpm add dorrat-cache

# yarn
yarn add dorrat-cache


---

Características clave

Característica	Detalle

TTL adaptativo	El tiempo de vida se alarga automáticamente según la frecuencia de acceso.
Estrategias LRU/LFU	Cambia entre Least-Recently-Used y Least-Frequently-Used con una sola opción.
Persistencia JSON	Guarda/restaura el estado en disco sin bloquear el event-loop.
API de eventos	Observa set, hit, del, evict, clear para métricas u hooks personalizados.
Compatibilidad total	Exportado como ESM default y CommonJS named (require).
TypeScript Ready	Incluye archivos .d.ts con generics para tipado estricto.



---

Ejemplos rápidos

ESM

import DorratCache from 'dorrat-cache';

const cache = new DorratCache({
  max: 100,          // capacidad
  ttl: 30_000,       // 30 s
  strategy: 'lfu',   // 'lru' por defecto
  persistence: './data/cache.json'
});

cache.set('saludo', 'Hola mundo 🎉');
console.log(cache.get('saludo'));        // → 'Hola mundo 🎉'

setTimeout(() => {
  console.log(cache.has('saludo'));      // → false (expirado)
}, 31_000);

CommonJS

const { DorratCache } = require('dorrat-cache');

const cache = new DorratCache({
  adaptive: false,   // desactiva extensión automática del TTL
  max: 50
});

cache.on('evict', key => console.log(`Expulsado: ${key}`));

for (let i = 0; i < 60; i++) cache.set(`k${i}`, i);
console.log(cache.size());               // → 50


---

API detallada

Constructor y opciones

new DorratCache(options?)

Opción	Tipo	Predeterminado	Descripción

max	number	256	Tamaño máximo de la caché.
ttl	number (ms)	60000	TTL base para nuevas entradas.
strategy	'lru' | 'lfu'	'lru'	Estrategia de expulsión.
adaptive	boolean	true	Extiende TTL cuando el elemento está por caducar.
persistence	boolean | string	false	true → ./dorrat-cache.json o ruta personalizada.


Métodos

Método	Retorno	Descripción

set(key, value, ttl?)	this	Inserta/actualiza con TTL específico.
get(key, default?)	V | undefined	Recupera valor o default.
has(key)	boolean	true si existe y no ha caducado.
ttl(key)	number	Milisegundos restantes; -1 si no existe.
delete(key)	boolean	Elimina y devuelve si existía.
clear()	void	Vacía la caché.
size()	number	Entradas actuales.
keys()	string[]	Array de claves vigentes.
values()	V[]	Array de valores.
entries()	[string, V][]	Pares clave-valor.
snapshot()	[string, V][]	Copia profunda para serializar/debug.
[Symbol.iterator]()	Iterator<[string, V]>	Permite for…of sobre entradas.


Eventos

Evento	Argumentos	Uso típico

set	(key, value)	Logs de escritura.
hit	(key, value)	Métricas de cache hit.
del	(key)	Auditoría de eliminación.
evict	(key)	Monitoreo de expulsiones.
clear	()	Reinicio de estadísticas.


cache.on('hit', (k, v) => promHistogram.observe(v));


---

Persistencia a disco

La serialización es debounced (400 ms) y no bloquea el event-loop:

const cache = new DorratCache({ persistence: true });
// escribe en ./dorrat-cache.json

Al iniciar, se restauran únicamente los elementos con exp > Date.now().


---

Estrategias de expulsión

LRU (predeterminado) — descarta la clave usada hace más tiempo.

LFU — descarta la clave con menos accesos totales (hits).


const lfuCache = new DorratCache({ strategy: 'lfu' });


---

Iteración y utilidades

for (const [key, value] of cache) {
  console.log(key, value);
}

console.table(cache.snapshot());   // copia estática para depuración


---

TypeScript

import DorratCache from 'dorrat-cache';

interface User {
  id: string;
  name: string;
}

const users = new DorratCache<User>({ ttl: 10_000 });
users.set('u1', { id: 'u1', name: 'Alice' });


---

Benchmarks

Caso	Ops/s*

Lectura (get hit)	2.8 M
Escritura (set)	1.9 M
Expulsión LRU @1M items	1.2 M


* Node v20, MacBook Air M2, 8 GB RAM.


---

Migración desde v1

Cambio	v1	v2 (actual)

Importación ESM	import {DorratCache}	import DorratCache
Estrategias	Solo LRU	LRU/LFU mediante opción
TTL adaptativo	Fijo	Activado por defecto
Persistencia debounce	~500 ms	400 ms
Tipos	Parciales	Completos (snapshot)



---

Contribuir

1. Fork y git clone


2. pnpm i


3. pnpm test


4. Envía tu pull request con una descripción clara.




---

Licencia

MIT © 2025 DIEGO-OFC



