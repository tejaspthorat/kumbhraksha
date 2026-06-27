  import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ljaqslfaftgttwezwzeq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_Vk2LHezXUq_gRxHkV4QZfQ_JscWb1Ds';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('Profile').select('*');
  console.log('Result (Profile):', { data, error });
  console.log('Result (Profile) stringified:', JSON.stringify({ data, error }, null, 2));

  // Also test email fetch
  const { data: q1, error: e1 } = await supabase.from('Profile').select('*').eq('email', 'siddharthgupta2482005@gmail.com').single();
  console.log('Result for specific email:', JSON.stringify({ data: q1, error: e1 }, null, 2));
}

main();
