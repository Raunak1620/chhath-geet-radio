# Chhath Geet Radio

Files: `index.html` and `api/wishes.js`. No build, no npm.

## Deploy on Vercel
1. Put both in a GitHub repo, import it on vercel.com (framework preset: Other), deploy.
2. **For the wish wall (2 clicks):** open the project > **Storage** > add **Upstash Redis** (free) > connect it to the project. Then redeploy once. Vercel sets the connection settings for you.

Until step 2, everything works except the wish wall, which says it is being set up.

## Test on your computer
Do not double-click `index.html`; YouTube refuses to play from `file://` (error 153). Run `python3 -m http.server 8000` and open http://localhost:8000 (the wish wall only works on Vercel).

## Edit songs
Find the `tracks` list in `index.html`. The id is the part after `watch?v=` in a YouTube link.

Songs play through YouTube's embedded player, so YouTube may show ads.
"# chhath-geet-radio" 
