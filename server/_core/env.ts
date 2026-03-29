function validateEnv() {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL,
    OWNER_OPEN_ID: process.env.OWNER_OPEN_ID,
  };

  const missing: string[] = [];
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(", ")}`;
    console.error("[Environment] " + error);
    if (process.env.NODE_ENV === "production") {
      throw new Error(error);
    } else {
      console.warn("[Environment] Continuing in development mode with missing vars");
    }
  }
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Validate environment on module load
if (typeof process !== "undefined" && process.env) {
  validateEnv();
}
