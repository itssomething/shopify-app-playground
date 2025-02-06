/**
 * Extracts the ID from a Shopify Global ID (GID) string
 * @param gid The GID string (e.g., "gid://shopify/Order/5996624543913")
 * @returns The extracted numeric ID
 */
export const extractIdFromGid = (gid: string): string => {
  return gid.split('/').pop() || '';
};

/**
 * Extracts both the resource type and ID from a Shopify Global ID (GID) string
 * @param gid The GID string (e.g., "gid://shopify/Order/5996624543913")
 * @returns An object containing the resource type and ID
 */
export const parseGid = (gid: string): { type: string; id: string } => {
  const parts = gid.split('/');
  return {
    type: parts[parts.length - 2] || '',
    id: parts[parts.length - 1] || ''
  };
};
