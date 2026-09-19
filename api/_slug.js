// Shared with the client copy in src/lib/format.js. Duplicated rather than
// imported because the /api handlers are CommonJS and run outside the CRA build.
const slugify = (value) =>
  String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = { slugify };
