// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qqlsmobjpcrfbumscpgc.supabase.co'; // replace with your real URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHNtb2JqcGNyZmJ1bXNjcGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDgxNTEsImV4cCI6MjA2OTY4NDE1MX0.UcxH4r3klODfLn-Nl0-4KEIrPU1BHOIuPdi9F-VWoSs'; // replace with your anon public key

export const supabase = createClient(supabaseUrl, supabaseKey);
