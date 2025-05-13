import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jebzppzqzjmocdrapddv.supabase.co'; // dashboard'tan al
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYnpwcHpxemptb2NkcmFwZGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDU5OTcsImV4cCI6MjA2MDM4MTk5N30.lH-wvwbwTLi3yinMBXcKAOoUkvfslYOcFOwrYt4qjv8';       // dashboard > Project settings > API

export const supabase = createClient(supabaseUrl, supabaseAnonKey);