export const uploadToImgur = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', 'file');
  const response = await fetch('https://api.imgur.com/3/upload', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID!}` // replace with your Client ID
    },
    body: formData
  });

  if (!response.ok) {
    return null;
  }

  const { data } = await response.json();

  if (!data) return null;

  return data.link;
};
