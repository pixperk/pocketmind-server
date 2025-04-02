

export const verifyGoogleToken = async (googleToken: string) => {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`
  );
  return response.json();
};
