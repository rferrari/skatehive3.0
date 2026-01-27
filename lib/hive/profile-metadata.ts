import { migrateLegacyMetadata } from "@/lib/utils/metadataMigration";

function isPlainObject(value: any) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(target: any, patch: any): any {
  if (patch === undefined) return target;
  if (Array.isArray(patch)) {
    return [...patch];
  }
  if (!isPlainObject(patch)) {
    return patch;
  }

  const base = isPlainObject(target) ? { ...target } : {};
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) return;
    const current = base[key];
    if (Array.isArray(value)) {
      base[key] = [...value];
      return;
    }
    if (isPlainObject(value)) {
      base[key] = deepMerge(current, value);
      return;
    }
    base[key] = value;
  });

  return base;
}

export function mergeHiveProfileMetadata({
  currentPosting,
  currentJson,
  profilePatch,
  extensionsPatch,
}: {
  currentPosting?: Record<string, any> | null;
  currentJson?: Record<string, any> | null;
  profilePatch?: Record<string, any>;
  extensionsPatch?: Record<string, any>;
}) {
  const posting = isPlainObject(currentPosting)
    ? { ...currentPosting }
    : {};
  if (profilePatch) {
    posting.profile = deepMerge(posting.profile || {}, profilePatch);
  }

  const migratedJson = migrateLegacyMetadata(currentJson || {});
  if (extensionsPatch) {
    migratedJson.extensions = deepMerge(
      migratedJson.extensions || {},
      extensionsPatch
    );
  }

  return { postingMetadata: posting, jsonMetadata: migratedJson };
}

export { deepMerge };
