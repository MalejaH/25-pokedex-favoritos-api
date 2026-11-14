function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export type FirebaseAdminConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export function firebaseAdminConfig(): FirebaseAdminConfig {
  return {
    projectId: required("FIREBASE_PROJECT_ID"),
    clientEmail: required("FIREBASE_CLIENT_EMAIL"),
    privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  };
}

export function firebaseWebApiKey(): string {
  return required("FIREBASE_WEB_API_KEY");
}

export function pokeApiBaseUrl(): string {
  return process.env.POKEAPI_BASE_URL ?? "https://pokeapi.co/api/v2";
}
