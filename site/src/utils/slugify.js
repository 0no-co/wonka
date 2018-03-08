const slugs = require(`github-slugger`)()

export const slugify = x => {
  slugs.reset();
  return slugs.slug(x);
};
