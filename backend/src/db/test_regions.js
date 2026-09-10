import pg from 'pg';

const regions = [
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-asia-southeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
];

const username = 'postgres.izkjlvzxbdlpsmmiticn';
const pass = 'cyberhucker1013';

for (const host of regions) {
  const uri = `postgresql://${username}:${pass}@${host}:6543/postgres`;
  console.log('Testing host:', host);
  const client = new pg.Client({ connectionString: uri, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('SUCCESS!! CONNECTED TO:', uri);
    await client.end();
    break;
  } catch (err) {
    console.log('Error for', host, ':', err.message);
  }
}
