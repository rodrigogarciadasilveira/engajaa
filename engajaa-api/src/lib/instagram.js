const CryptoJS = require('crypto-js');

const AES_SECRET = process.env.AES_SECRET;
const IG_AUTH   = 'https://www.instagram.com';
const IG_TOKEN  = 'https://api.instagram.com';
const IG_GRAPH  = 'https://graph.instagram.com';
const FB_GRAPH  = 'https://graph.facebook.com/v21.0';

function encryptToken(token) {
  return CryptoJS.AES.encrypt(token, AES_SECRET).toString();
}

function decryptToken(cipher) {
  return CryptoJS.AES.decrypt(cipher, AES_SECRET).toString(CryptoJS.enc.Utf8);
}

function getOAuthUrl(tenantId) {
  const url = new URL(`${IG_AUTH}/oauth/authorize`);
  url.searchParams.set('client_id', process.env.IG_CLIENT_ID);
  url.searchParams.set('redirect_uri', process.env.IG_REDIRECT_URI);
  url.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', Buffer.from(tenantId).toString('base64'));
  return url.toString();
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: process.env.IG_CLIENT_ID,
    client_secret: process.env.IG_CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.IG_REDIRECT_URI,
    code,
  });
  const res = await fetch(`${IG_TOKEN}/oauth/access_token`, { method: 'POST', body: params });
  if (!res.ok) throw new Error(`Failed to exchange code: ${await res.text()}`);
  return res.json(); // { access_token, token_type, expires_in, permissions, user_id }
}

async function getLongLivedToken(shortToken) {
  // Instagram Login uses graph.instagram.com (not graph.facebook.com) for token exchange
  const url = new URL(`${IG_GRAPH}/access_token`);
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', process.env.IG_CLIENT_SECRET);
  url.searchParams.set('access_token', shortToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to get long-lived token: ${await res.text()}`);
  return res.json(); // { access_token, token_type, expires_in }
}

async function refreshLongLivedToken(token) {
  // Instagram Login refresh also uses graph.instagram.com
  const url = new URL(`${IG_GRAPH}/refresh_access_token`);
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to refresh token: ${await res.text()}`);
  return res.json();
}

async function getProfile(igUserId, token) {
  const url = new URL(`${IG_GRAPH}/me`);
  url.searchParams.set('fields', 'id,username,followers_count,media_count,profile_picture_url,biography,website');
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to get profile: ${await res.text()}`);
  return res.json();
}

async function getMediaList(_igAccountId, token, limit = 50) {
  // Use /me/media — works reliably with Instagram Login user tokens
  const url = new URL(`${IG_GRAPH}/me/media`);
  url.searchParams.set('fields', 'id,media_type,caption,timestamp,like_count,comments_count,media_url,thumbnail_url,permalink');
  url.searchParams.set('limit', limit);
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    console.error('[getMediaList] error:', body);
    throw new Error(`Failed to get media list: ${body}`);
  }
  return res.json();
}

async function getMediaInsights(mediaId, token) {
  const url = new URL(`${IG_GRAPH}/${mediaId}/insights`);
  url.searchParams.set('metric', 'impressions,reach,saved,shares');
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return res.json();
}

module.exports = {
  encryptToken, decryptToken,
  getOAuthUrl, exchangeCodeForToken, getLongLivedToken, refreshLongLivedToken,
  getProfile, getMediaList, getMediaInsights,
};
