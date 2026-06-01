export interface EncodingComparison {
  encodeURI: string;
  encodeURIComponent: string;
  strictRfc3986: string;
  form: string;
}

export function strictEncodeURIComponent(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function formEncode(value: string): string {
  return strictEncodeURIComponent(value).replace(/%20/g, "+");
}

export function compareEncodings(value: string): EncodingComparison {
  return {
    encodeURI: encodeURI(value),
    encodeURIComponent: encodeURIComponent(value),
    strictRfc3986: strictEncodeURIComponent(value),
    form: formEncode(value),
  };
}
