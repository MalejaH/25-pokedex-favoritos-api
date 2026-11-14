export type Data = Record<string, unknown>;

type Snapshot = {
  id: string;
  exists: boolean;
  data: () => Data | undefined;
  get: (field: string) => unknown;
};

type DocumentRef = {
  id: string;
  store: Map<string, Data>;
  get: () => Promise<Snapshot>;
  set: (value: Data) => Promise<void>;
  update: (value: Data) => Promise<void>;
  delete: () => Promise<void>;
};

type Query = {
  where: (field: string, operator: string, value: unknown) => Query;
  orderBy: (field: string) => Query;
  limit: (count: number) => Query;
  get: () => Promise<{ docs: Snapshot[] }>;
};

function snapshotOf(id: string, value: Data | undefined): Snapshot {
  return {
    id,
    exists: value !== undefined,
    data: () => value,
    get: (field: string) => value?.[field],
  };
}

function createQuery(source: Array<{ id: string; value: Data }>): Query {
  let items = [...source];
  const query: Query = {
    where(field, operator, value) {
      if (operator === ">") {
        items = items.filter((item) => String(item.value[field] ?? "") > String(value));
      }
      return query;
    },
    orderBy(field) {
      items = [...items].sort((left, right) =>
        String(left.value[field] ?? "").localeCompare(String(right.value[field] ?? "")),
      );
      return query;
    },
    limit(count) {
      items = items.slice(0, count);
      return query;
    },
    get: async () => ({ docs: items.map((item) => snapshotOf(item.id, item.value)) }),
  };
  return query;
}

function createCollection(store: Map<string, Data>) {
  const document = (id: string): DocumentRef => ({
    id,
    store,
    get: async () => snapshotOf(id, store.get(id)),
    set: async (value) => {
      store.set(id, value);
    },
    update: async (value) => {
      store.set(id, { ...(store.get(id) ?? {}), ...value });
    },
    delete: async () => {
      store.delete(id);
    },
  });
  return {
    doc: document,
    where: (field: string, operator: string, value: unknown) =>
      createQuery([...store.entries()].map(([id, value]) => ({ id, value }))).where(
        field,
        operator,
        value,
      ),
    orderBy: (field: string) =>
      createQuery([...store.entries()].map(([id, value]) => ({ id, value }))).orderBy(field),
    get: async () => ({
      docs: [...store.entries()].map(([id, value]) => snapshotOf(id, value)),
    }),
  };
}

export function createFakeFirestore() {
  const cache = new Map<string, Data>();
  const users = new Map<string, Map<string, Map<string, Data>>>();

  function userCollection(uid: string, resource: string) {
    const byResource = users.get(uid) ?? new Map<string, Map<string, Data>>();
    users.set(uid, byResource);
    const store = byResource.get(resource) ?? new Map<string, Data>();
    byResource.set(resource, store);
    return createCollection(store);
  }

  function collection(name: string) {
    if (name === "usuarios") {
      return {
        doc: (uid: string) => ({
          collection: (resource: string) => userCollection(uid, resource),
        }),
      };
    }
    if (name === "cache_pokemon") {
      return createCollection(cache);
    }
    throw new Error(`Colección inesperada: ${name}`);
  }

  function batch() {
    const operations: Array<() => void> = [];
    return {
      set: (reference: DocumentRef, value: Data) => {
        operations.push(() => reference.store.set(reference.id, value));
      },
      delete: (reference: DocumentRef) => {
        operations.push(() => reference.store.delete(reference.id));
      },
      commit: async () => {
        for (const operation of operations) {
          operation();
        }
      },
    };
  }

  return {
    db: { collection, batch },
    cache,
    userStore: (uid: string, resource: string) => userCollection(uid, resource),
    userRecords: (uid: string, resource: string) =>
      users.get(uid)?.get(resource) ?? new Map<string, Data>(),
  };
}
