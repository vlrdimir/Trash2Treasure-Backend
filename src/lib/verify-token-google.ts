import { OAuth2Client } from "google-auth-library";

const oAuth2Client = new OAuth2Client({
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
});

export async function verifyTokenGoogle(idToken: string) {
  const ticket = await oAuth2Client.verifyIdToken({
    idToken: idToken,
    audience: process.env.AUTH_GOOGLE_ID,
  });
  const payload = ticket.getPayload();
  return payload;
}
