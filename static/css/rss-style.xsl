<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  exclude-result-prefixes="itunes content atom">

  <xsl:output method="html" version="5.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/rss/channel">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title><xsl:value-of select="title" /> – Podcast Feed</title>
        <!-- Link to your ai.css – adjust path if needed -->
        <link rel="stylesheet" href="../static/css/ai.css" />
        <!-- Fallback inline style to match the futuristic look -->
        <style>
          /* mini reset and body overrides */
          body { background: #0a0e1a; margin: 0; padding: 2rem; }
          .rss-container { max-width: 1200px; margin: 0 auto; }
          .rss-header { text-align: center; margin-bottom: 2rem; }
          .rss-header h1 { color: #00e0ff; font-size: 2.8rem; }
          .rss-header p { color: #94a3b8; }
          .project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
          /* card styling already in ai.css, but we reuse project-card etc. */
          .project-card { background: rgba(255,255,255,0.08); backdrop-filter: blur(10px); border: 1px solid rgba(0,224,255,0.3); border-radius: 15px; padding: 20px; transition: 0.3s; }
          .project-card:hover { transform: translateY(-5px); border-color: #00e0ff; box-shadow: 0 0 20px rgba(0,224,255,0.3); }
          .card-content h3 { color: #00e0ff; }
          .download-link a { color: #00e0ff; text-decoration: none; font-weight: 600; }
          .download-link a:hover { color: #fff; }
          audio { width: 100%; margin-top: 10px; border-radius: 8px; }
          .badge { background: linear-gradient(135deg, #fff, #00fedc); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: bold; }
          .project-date { color: #00e0ff; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 8px 0; margin: 15px 0; }
          .pageCade { color: #ccc; }
          .list p { margin-left: 10px; }
          blockquote { border-left: 3px solid #00e0ff; padding-left: 10px; font-style: italic; color: #ddd; }
          .cta { font-weight: bold; margin-top: 20px; color: #00e0ff; }
          .footer-note { text-align: center; margin-top: 3rem; color: #64748b; border-top: 1px solid #1b1f29; padding-top: 1.5rem; }
        </style>
      </head>
      <body>
        <div class="rss-container">
          <!-- Header -->
          <div class="rss-header">
            <h1><xsl:value-of select="title" /></h1>
            <p><xsl:value-of select="description" /></p>
            <p style="font-size:0.9rem; color:#00e0ff;">
              Host: <xsl:value-of select="itunes:author" /> &bull;
              <xsl:value-of select="language" />
            </p>
            <p><a href="{link}" style="color:#00e0ff; text-decoration:underline;">Visit the show website</a></p>
          </div>

          <!-- Episode Grid -->
          <div class="project-grid">
            <xsl:for-each select="item">
              <div class="project-card">
                <div class="card-content">
                  <span class="badge">
                    <xsl:choose>
                      <xsl:when test="itunes:episodeType = 'full'">Podcast</xsl:when>
                      <xsl:otherwise>Episode</xsl:otherwise>
                    </xsl:choose>
                  </span>
                  <b class="dot"> • </b>
                  <i class="badge_sub"><xsl:value-of select="itunes:category/@text" /></i>

                  <h3 class="title"><xsl:value-of select="title" /></h3>

                  <div class="project-date">
                    <b>Episode <xsl:value-of select="itunes:episode" /></b>
                    <strong>|</strong> 📅
                    <i><strong><xsl:value-of select="substring(pubDate,1,16)" /></strong></i>
                  </div>

                  <div class="info" style="max-height:220px; overflow-y:auto; margin:-5px; display:flex; flex-direction:column; align-items:center;">
                    <!-- we can't show images without explicit enclosure, but we can show description -->
                    <div class="pageCade" style="font-size:0.9em; text-align:justify;">
                      <xsl:value-of select="description" disable-output-escaping="yes" />
                    </div>
                  </div>

                  <!-- Audio player -->
                  <audio controls>
                    <source src="{enclosure/@url}" type="{enclosure/@type}" />
                    Your browser does not support the audio element.
                  </audio>

                  <!-- Download link -->
                  <div class="download-link">
                    <a href="{enclosure/@url}" download="Episode_{itunes:episode}.mp3">⬇ Download</a>
                  </div>
                </div>
              </div>
            </xsl:for-each>
          </div>

          <div class="footer-note">
            <p>Generated from <strong>The AI Chat Show</strong> RSS feed &bull; <xsl:value-of select="lastBuildDate" /></p>
            <p><a href="mailto:forracorp1@gmail.com" style="color:#00e0ff;">📧 forracorp1@gmail.com</a></p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>