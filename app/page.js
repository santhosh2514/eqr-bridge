
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">QR Code Generator</h1>
      <p className="mb-4">
        Generate a QR code for your website link. Use the admin panel to manage
        your QR codes.
      </p>
      <a
        href="/admin"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Go to Admin Panel
      </a>
    </div>
  );
}
