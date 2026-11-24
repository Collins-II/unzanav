export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({ error: 'Not implemented' }), { status: 501 });
}