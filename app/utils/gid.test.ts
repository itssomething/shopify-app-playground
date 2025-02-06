import { extractIdFromGid, parseGid } from './gid';

const gid = "gid://shopify/Order/5996624543913";

console.log(extractIdFromGid(gid)); // "5996624543913"
console.log(parseGid(gid)); // { type: "Order", id: "5996624543913" }
