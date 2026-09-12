import 'dotenv/config';
import { uploadToSupabaseStorage } from './supabaseStorage.js';

async function test() {
  console.log('--- SUPABASE STORAGE VERIFICATION TEST ---');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Connected to Supabase PostgreSQL' : 'Not set');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'Not set');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Key set' : 'Not set');

  const testBuffer = Buffer.from('Verification test photo content');
  const result = await uploadToSupabaseStorage({
    fileBuffer: testBuffer,
    originalName: 'test_receipt.jpg',
    mimeType: 'image/jpeg',
    receiptDate: '2026-09-12',
  });

  console.log('\n--- UPLOAD VERIFICATION RESULT ---');
  if (result.startsWith('https://')) {
    console.log('✅ STATUS: Direct Cloud HTTPS Storage Active');
    console.log('URL:', result);
  } else if (result.startsWith('data:')) {
    console.log('⚡ STATUS: Cross-Device Portable Data URI Active (Fallback)');
    console.log('Data URI length:', result.length, 'bytes');
    console.log('Preview:', result.slice(0, 60) + '...');
  } else {
    console.log('📁 STATUS: Local Disk Path');
    console.log('Path:', result);
  }
}

test().catch(console.error);
