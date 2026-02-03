const baseUrl = 'https://mpaataempire.ug'

const pages = ['', '/rooms', '/my']

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0]

  const staticPages = pages
    .map((page) => `
      <url>
        <loc>${baseUrl}${page}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>${page === '' ? '1.0' : '0.8'}</priority>
      </url>
    `)
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages}
</urlset>`
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml')
  res.status(200).send(generateSitemap())
}