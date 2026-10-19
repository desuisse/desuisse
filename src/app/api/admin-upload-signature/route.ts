import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAdmin } from '@/lib/session';

export async function POST(req: NextRequest) {
  if (!(await getRequestAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Image uploads are not configured' }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const assetFolder = 'desuisse/products';
  const signature = createHash('sha1')
    .update(`asset_folder=${assetFolder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  return NextResponse.json(
    { cloudName, apiKey, timestamp, signature, assetFolder },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
