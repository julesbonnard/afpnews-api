export default function btoa (str: string) {
  return Buffer.from(str, 'binary').toString('base64')
}
